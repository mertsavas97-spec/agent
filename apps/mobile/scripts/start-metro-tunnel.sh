#!/usr/bin/env bash
# Metro + localtunnel — cloud ortamından telefona public URL.
# Cloudflared/ngrok bu ortamda güvenilir değil; localtunnel kullanılır.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${METRO_PORT:-8081}"
LT_LOG="/tmp/cozbil-metro-lt.log"
INFO="/tmp/cozbil-metro-connect.txt"
TMUX_CONF="-f /exec-daemon/tmux.portal.conf"
tmux() { command tmux $TMUX_CONF "$@"; }

echo "==> Metro + localtunnel (port $PORT)"

# Metro
if ! curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
  tmux kill-session -t cozbil-metro 2>/dev/null || true
  pkill -f "expo start --dev-client --port ${PORT}" 2>/dev/null || true
  sleep 1
  tmux new-session -d -s cozbil-metro -c "$ROOT" -- \
    npx expo start --dev-client --port "$PORT"
  for i in $(seq 1 45); do
    curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1 && break
    sleep 1
  done
fi

if ! curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
  echo "Metro başlamadı."
  exit 1
fi

# Tunnel — eski oturumları kapat
pkill -f "localtunnel --port ${PORT}" 2>/dev/null || true
pkill -f "cloudflared tunnel --url http://127.0.0.1:${PORT}" 2>/dev/null || true
tmux kill-session -t cozbil-metro-tunnel 2>/dev/null || true
sleep 1
: >"$LT_LOG"
tmux new-session -d -s cozbil-metro-tunnel -- bash -lc \
  "npx localtunnel --port ${PORT} 2>&1 | tee -a ${LT_LOG}"

TUNNEL_URL=""
for i in $(seq 1 45); do
  TUNNEL_URL=$(rg -o 'https://[a-z0-9-]+\.loca\.lt' "$LT_LOG" 2>/dev/null | head -1 || true)
  [[ -n "$TUNNEL_URL" ]] && break
  sleep 1
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Tunnel URL alınamadı. Log: $LT_LOG"
  exit 1
fi

HOST="${TUNNEL_URL#https://}"

# Metro'yu tunnel hostname ile yeniden başlat (QR/deep link doğru host göstersin)
tmux kill-session -t cozbil-metro 2>/dev/null || true
pkill -f "expo start --dev-client --port ${PORT}" 2>/dev/null || true
sleep 2
tmux new-session -d -s cozbil-metro -c "$ROOT" -- bash -lc \
  "export REACT_NATIVE_PACKAGER_HOSTNAME='${HOST}' EXPO_PACKAGER_PROXY_URL='${TUNNEL_URL}'; npx expo start --dev-client --port ${PORT}"

for i in $(seq 1 45); do
  curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1 && break
  sleep 1
done

# Doğrulama (localtunnel interstitial için header)
for i in $(seq 1 15); do
  if curl -sf -H 'Bypass-Tunnel-Reminder: true' "${TUNNEL_URL}/status" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! curl -sf -H 'Bypass-Tunnel-Reminder: true' "${TUNNEL_URL}/status" >/dev/null 2>&1; then
  echo "Tunnel Metro'ya ulaşamıyor. Birkaç saniye sonra tekrar dene."
  exit 1
fi

ENC=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${TUNNEL_URL}', safe=''))")

cat >"$INFO" <<EOF
TUNNEL_URL=${TUNNEL_URL}
MANUAL_1=${HOST}:443
MANUAL_2=${TUNNEL_URL}
DEEP_LINK=exp+cozbil://expo-development-client/?url=${ENC}
EOF

echo ""
echo "=============================================="
echo "Metro + tunnel HAZIR"
echo ""
echo "Dev client → Enter URL manually (sırayla dene):"
echo "  1) ${HOST}:443"
echo "  2) ${TUNNEL_URL}"
echo ""
echo "Deep link (Safari):"
echo "  exp+cozbil://expo-development-client/?url=${ENC}"
echo ""
echo "İlk bağlantıda localtunnel 'Continue' sayfası çıkarsa,"
echo "Safari'de ${TUNNEL_URL} açıp onayla, sonra dev client'ı tekrar dene."
echo ""
echo "ÖNEMLİ: 172.30.x veya localhost telefondan ÇALIŞMAZ."
echo "Mac'te en güvenilir yol:"
echo "  bash scripts/phone-dev-build.sh metro --tunnel"
echo "=============================================="
