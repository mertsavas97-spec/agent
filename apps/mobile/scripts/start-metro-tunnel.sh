#!/usr/bin/env bash
# Metro + localhost.run SSH tunnel (cloud → phone).
# localtunnel drops; cloudflared quick tunnels often NXDOMAIN/502 here.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${METRO_PORT:-8081}"
SSH_LOG="/tmp/cozbil-metro-lhr.log"
INFO="/tmp/cozbil-metro-connect.txt"
TMUX_CONF="-f /exec-daemon/tmux.portal.conf"
tmux() { command tmux $TMUX_CONF "$@"; }

echo "==> Metro + localhost.run (port $PORT)"

# Clean old tunnels (ignore missing)
pkill -f "nokey@localhost.run" 2>/dev/null || true
pkill -f "ssh.*localhost.run" 2>/dev/null || true
pkill -f "localtunnel --port ${PORT}" 2>/dev/null || true
pkill -f "cloudflared tunnel --url http://127.0.0.1:${PORT}" 2>/dev/null || true
tmux kill-session -t cozbil-metro-tunnel 2>/dev/null || true
sleep 1

# Metro (any host first)
if ! curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
  tmux kill-session -t cozbil-metro 2>/dev/null || true
  pkill -f "expo start --dev-client --port ${PORT}" 2>/dev/null || true
  sleep 1
  tmux new-session -d -s cozbil-metro -c "$ROOT" -- bash -lc \
    "npx expo start --dev-client --port ${PORT}"
  for i in $(seq 1 50); do
    curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1 && break
    sleep 1
  done
fi

if ! curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
  echo "Metro başlamadı."
  exit 1
fi

: >"$SSH_LOG"
tmux new-session -d -s cozbil-metro-tunnel -- bash -lc \
  "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 80:127.0.0.1:${PORT} nokey@localhost.run 2>&1 | tee ${SSH_LOG}"

TUNNEL_URL=""
for i in $(seq 1 45); do
  TUNNEL_URL=$(rg -o 'https://[a-z0-9]+\.lhr\.life' "$SSH_LOG" 2>/dev/null | head -1 || true)
  if [[ -z "$TUNNEL_URL" ]]; then
    TUNNEL_URL=$(rg -o 'https://[a-z0-9.-]+\.lhr\.life' "$SSH_LOG" 2>/dev/null | head -1 || true)
  fi
  [[ -n "$TUNNEL_URL" ]] && break
  sleep 1
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Tunnel URL alınamadı. Log:"
  cat "$SSH_LOG" || true
  exit 1
fi

HOST="${TUNNEL_URL#https://}"
echo "Tunnel: $TUNNEL_URL"

ok=0
for i in $(seq 1 20); do
  code=$(curl -sS -m 10 -o /tmp/lhr-status.body -w "%{http_code}" "${TUNNEL_URL}/status" 2>/dev/null || echo 000)
  body=$(cat /tmp/lhr-status.body 2>/dev/null || true)
  echo "  verify $i -> HTTP $code ($body)"
  if [[ "$code" == "200" && "$body" == *"packager-status:running"* ]]; then
    ok=1
    break
  fi
  sleep 2
done

if [[ "$ok" != "1" ]]; then
  echo "Tunnel Metro'ya ulaşamıyor."
  exit 1
fi

# Restart Metro so deep link / QR use public host
tmux kill-session -t cozbil-metro 2>/dev/null || true
pkill -f "expo start --dev-client --port ${PORT}" 2>/dev/null || true
sleep 2
tmux new-session -d -s cozbil-metro -c "$ROOT" -- bash -lc \
  "export REACT_NATIVE_PACKAGER_HOSTNAME='${HOST}' EXPO_PACKAGER_PROXY_URL='${TUNNEL_URL}'; npx expo start --dev-client --port ${PORT}"

for i in $(seq 1 50); do
  curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1 && break
  sleep 1
done

# Confirm tunnel still works after Metro restart
sleep 2
code=$(curl -sS -m 10 -o /tmp/lhr-status.body -w "%{http_code}" "${TUNNEL_URL}/status" 2>/dev/null || echo 000)
if [[ "$code" != "200" ]]; then
  echo "Metro restart sonrası tunnel doğrulaması başarısız (HTTP $code)."
  exit 1
fi

ENC=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${TUNNEL_URL}', safe=''))")
ENC_HTTP=$(python3 -c "import urllib.parse; print(urllib.parse.quote('http://${HOST}', safe=''))")

cat >"$INFO" <<EOF
TUNNEL_URL=${TUNNEL_URL}
MANUAL_1=${HOST}:443
MANUAL_2=${TUNNEL_URL}
MANUAL_3=http://${HOST}
MANUAL_4=exp://${HOST}:443
DEEP_LINK=exp+cozbil://expo-development-client/?url=${ENC}
DEEP_LINK_HTTP=exp+cozbil://expo-development-client/?url=${ENC_HTTP}
EOF

echo ""
echo "=============================================="
echo "Metro + tunnel HAZIR (localhost.run)"
echo ""
echo "Dev client → Enter URL manually (sırayla):"
echo "  1) ${HOST}:443"
echo "  2) ${TUNNEL_URL}"
echo "  3) http://${HOST}"
echo ""
echo "Deep link (Safari/Chrome):"
echo "  exp+cozbil://expo-development-client/?url=${ENC}"
echo ""
echo "Android HTTPS sorununda:"
echo "  exp+cozbil://expo-development-client/?url=${ENC_HTTP}"
echo ""
echo "ÖNEMLİ: 172.30.x / localhost / eski loca.lt URL'leri ÇALIŞMAZ."
echo "=============================================="
