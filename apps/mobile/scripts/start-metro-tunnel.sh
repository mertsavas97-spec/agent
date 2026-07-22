#!/usr/bin/env bash
# Metro + public tunnel for phone native (dev-client) from Cloud Agents.
# Prefer cloudflared (stable). Fallback: localhost.run SSH.
# Do NOT use pkill -f patterns that appear in this script's argv (kills self).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${METRO_PORT:-8081}"
INFO="/tmp/cozbil-metro-connect.txt"
CF_BIN="${CLOUDFLARED_BIN:-}"
TMUX_CONF="-f /exec-daemon/tmux.portal.conf"
tmux() { command tmux $TMUX_CONF "$@"; }

resolve_cloudflared() {
  if [[ -n "$CF_BIN" && -x "$CF_BIN" ]]; then
    echo "$CF_BIN"
    return 0
  fi
  if command -v cloudflared >/dev/null 2>&1; then
    command -v cloudflared
    return 0
  fi
  if [[ -x /tmp/cloudflared ]]; then
    echo /tmp/cloudflared
    return 0
  fi
  local dest="/tmp/cloudflared"
  echo "==> downloading cloudflared → $dest" >&2
  curl -fsSL -o "$dest" \
    "https://github.com/cloudflare/cloudflared/releases/download/2025.2.1/cloudflared-linux-amd64" \
    && chmod +x "$dest" && echo "$dest"
}

echo "==> Metro + tunnel (port $PORT)"

# Clean previous tunnel session only (avoid pkill -f self-match)
tmux kill-session -t cozbil-metro-tunnel 2>/dev/null || true
sleep 1

# Metro once
if ! curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
  tmux kill-session -t cozbil-metro 2>/dev/null || true
  sleep 1
  fuser -k "${PORT}/tcp" 2>/dev/null || true
  sleep 1
  tmux new-session -d -s cozbil-metro -c "$ROOT" -- \
    npx expo start --dev-client --port "${PORT}"
  for i in $(seq 1 60); do
    curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1 && break
    sleep 1
  done
fi

if ! curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
  echo "Metro başlamadı."
  exit 1
fi

PROVIDER=""
TUNNEL_URL=""

# --- Prefer Serveo: localhost.run drops large Hermes bundles mid-transfer ---
SSH_LOG="/tmp/cozbil-metro-serveo.log"
: >"$SSH_LOG"
echo "==> serveo.net"
tmux new-session -d -s cozbil-metro-tunnel -- bash -lc \
  "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=4 -R 80:127.0.0.1:${PORT} serveo.net 2>&1 | tee ${SSH_LOG}"
for i in $(seq 1 45); do
  TUNNEL_URL=$(rg -o 'https://[a-z0-9.-]+\.(serveousercontent\.com|serveo\.net)' "$SSH_LOG" 2>/dev/null | head -1 || true)
  [[ -n "$TUNNEL_URL" ]] && break
  sleep 1
done
if [[ -n "$TUNNEL_URL" ]]; then
  PROVIDER=serveo
else
  echo "serveo URL alınamadı; cloudflared / localhost.run deneniyor."
  tmux kill-session -t cozbil-metro-tunnel 2>/dev/null || true
  sleep 1
fi

# --- cloudflared (often NXDOMAIN in this Cloud Agent egress) ---
if [[ -z "$TUNNEL_URL" ]]; then
  CF=$(resolve_cloudflared 2>/dev/null || true)
  if [[ -n "$CF" && -x "$CF" ]]; then
    echo "==> cloudflared: $CF"
    tmux new-session -d -s cozbil-metro-tunnel -- \
      "$CF" tunnel --url "http://127.0.0.1:${PORT}" --no-autoupdate
    for i in $(seq 1 45); do
      TUNNEL_URL=$(tmux capture-pane -t cozbil-metro-tunnel -p -J -S -80 2>/dev/null \
        | rg -o 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1 || true)
      [[ -n "$TUNNEL_URL" ]] && break
      sleep 1
    done
    if [[ -n "$TUNNEL_URL" ]]; then
      PROVIDER=cloudflared
    else
      tmux kill-session -t cozbil-metro-tunnel 2>/dev/null || true
      sleep 1
    fi
  fi
fi

# --- Last resort: localhost.run (fragile for ~12MB bundles) ---
if [[ -z "$TUNNEL_URL" ]]; then
  SSH_LOG="/tmp/cozbil-metro-lhr.log"
  : >"$SSH_LOG"
  tmux new-session -d -s cozbil-metro-tunnel -- bash -lc \
    "ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -R 80:127.0.0.1:${PORT} nokey@localhost.run 2>&1 | tee ${SSH_LOG}"
  for i in $(seq 1 45); do
    TUNNEL_URL=$(rg -o 'https://[a-z0-9.-]+\.lhr\.life' "$SSH_LOG" 2>/dev/null | head -1 || true)
    [[ -n "$TUNNEL_URL" ]] && break
    sleep 1
  done
  PROVIDER=localhost.run
fi

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Tunnel URL alınamadı."
  tmux capture-pane -t cozbil-metro-tunnel -p -J -S -100 2>/dev/null || true
  exit 1
fi

HOST="${TUNNEL_URL#https://}"
echo "Tunnel ($PROVIDER): $TUNNEL_URL"

ok=0
for i in $(seq 1 30); do
  code=$(curl -sS -m 12 -o /tmp/cozbil-tunnel-status.body -w "%{http_code}" \
    -A 'okhttp/4.9.0' "${TUNNEL_URL}/status" 2>/dev/null || echo 000)
  body=$(cat /tmp/cozbil-tunnel-status.body 2>/dev/null || true)
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

# Rebind Metro so QR / deep link match public host.
# Explicit :443 is required: React Native defaults a missing port to :8081,
# which breaks localhost.run / cloudflared HTTPS frontends.
tmux kill-session -t cozbil-metro 2>/dev/null || true
sleep 1
fuser -k "${PORT}/tcp" 2>/dev/null || true
sleep 1
tmux new-session -d -s cozbil-metro -c "$ROOT" -- \
  env REACT_NATIVE_PACKAGER_HOSTNAME="${HOST}" EXPO_PACKAGER_PROXY_URL="https://${HOST}:443" \
  npx expo start --dev-client --port "${PORT}"

for i in $(seq 1 60); do
  curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1 && break
  sleep 1
done

ok=0
for i in $(seq 1 30); do
  code=$(curl -sS -m 12 -o /tmp/cozbil-tunnel-status.body -w "%{http_code}" \
    -A 'okhttp/4.9.0' "${TUNNEL_URL}/status" 2>/dev/null || echo 000)
  body=$(cat /tmp/cozbil-tunnel-status.body 2>/dev/null || true)
  echo "  post-metro $i -> HTTP $code ($body)"
  if [[ "$code" == "200" && "$body" == *"packager-status:running"* ]]; then
    ok=1
    break
  fi
  sleep 2
done

if [[ "$ok" != "1" ]]; then
  echo "Metro restart sonrası tunnel doğrulaması başarısız."
  exit 1
fi

# iOS/RN defaults missing ports to :8081. localhost.run terminates TLS on :443,
# so the packager URL MUST include an explicit :443 (or bare host:443).
TUNNEL_URL_443="https://${HOST}:443"
ENC=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${TUNNEL_URL_443}', safe=''))")
ENC_BARE=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${HOST}:443', safe=''))")

cat >"$INFO" <<EOF
TUNNEL_URL=${TUNNEL_URL}
TUNNEL_URL_443=${TUNNEL_URL_443}
MANUAL_1=${HOST}:443
MANUAL_2=${TUNNEL_URL_443}
MANUAL_3=${TUNNEL_URL}
DEEP_LINK=exp+cozbil://expo-development-client/?url=${ENC}
DEEP_LINK_BARE=exp+cozbil://expo-development-client/?url=${ENC_BARE}
PROVIDER=${PROVIDER}
EOF

echo ""
echo "=============================================="
echo "Metro + tunnel HAZIR (${PROVIDER})"
echo ""
echo "Dev client → Enter URL manually (use :443, NEVER :8081):"
echo "  1) ${HOST}:443"
echo "  2) ${TUNNEL_URL_443}"
echo ""
echo "Deep link (Safari/Notes):"
echo "  exp+cozbil://expo-development-client/?url=${ENC}"
echo ""
echo "Yanlış: https://${HOST}:8081  (tunnel'da 8081 yok → Could not connect)"
echo "Eski lhr.life / 172.30.x / localhost URL'leri ÇALIŞMAZ."
echo "=============================================="
