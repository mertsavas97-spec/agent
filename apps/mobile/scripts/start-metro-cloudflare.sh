#!/usr/bin/env bash
# Metro + public tunnel (localtunnel) — telefon bulut ortamına bağlanabilsin.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${METRO_PORT:-8081}"
LT_LOG="/tmp/cozbil-metro-lt.log"
TMUX_CONF="-f /exec-daemon/tmux.portal.conf"

tmux() { command tmux $TMUX_CONF "$@"; }

echo "Stopping old Metro / tunnel sessions..."
tmux kill-session -t cozbil-metro 2>/dev/null || true
tmux kill-session -t cozbil-metro-tunnel 2>/dev/null || true
pkill -f 'expo start' 2>/dev/null || true
pkill -f "localtunnel --port ${PORT}" 2>/dev/null || true
pkill -f "cloudflared tunnel --url http://127.0.0.1:${PORT}" 2>/dev/null || true
sleep 2

echo "Starting Metro on :${PORT}..."
tmux new-session -d -s cozbil-metro -c "$ROOT" -- bash -lc \
  "npx expo start --dev-client --port ${PORT} --clear"

for i in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sf "http://127.0.0.1:${PORT}/status" >/dev/null 2>&1; then
  echo "Metro başlamadı."
  exit 1
fi

: >"$LT_LOG"
echo "Starting localtunnel..."
tmux new-session -d -s cozbil-metro-tunnel -- bash -lc \
  "npx localtunnel --port ${PORT} 2>&1 | tee -a ${LT_LOG}"

TUNNEL_URL=""
for i in $(seq 1 40); do
  TUNNEL_URL=$(rg -o 'https://[a-z0-9-]+\.loca\.lt' "$LT_LOG" | head -1 || true)
  if [[ -n "$TUNNEL_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Tunnel URL alınamadı. Log: $LT_LOG"
  exit 1
fi

HOST="${TUNNEL_URL#https://}"
echo "Restarting Metro with tunnel hostname: $HOST"
tmux send-keys -t cozbil-metro:0.0 C-c
sleep 2
tmux send-keys -t cozbil-metro:0.0 \
  "cd ${ROOT} && REACT_NATIVE_PACKAGER_HOSTNAME=${HOST} EXPO_PACKAGER_PROXY_URL=${TUNNEL_URL} npx expo start --dev-client --port ${PORT}" C-m

for i in $(seq 1 30); do
  if curl -sf -H 'Bypass-Tunnel-Reminder: true' "${TUNNEL_URL}/status" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

ENC_URL=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${TUNNEL_URL}', safe=''))")

echo ""
echo "=============================================="
echo "Metro + tunnel hazır"
echo "Manuel URL (dev client): ${TUNNEL_URL}"
echo "Deep link:"
echo "exp+cozbil://expo-development-client/?url=${ENC_URL}"
echo ""
echo "Not: 172.30.x / localhost telefondan çalışmaz."
echo "tmux Metro:  tmux attach -t cozbil-metro"
echo "tmux tunnel: tmux attach -t cozbil-metro-tunnel"
echo "=============================================="
