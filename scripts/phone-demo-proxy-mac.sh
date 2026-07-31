#!/usr/bin/env bash
# Mac: şahsi telefon demosu için yerel solve-proxy (Cloud Functions AI beklemeden)
#
# Neden: Canlı Firestore solve sıkça 40–60s+ sürüyor veya takılıyor; ping 403
# olsa bile Storage trigger "running" kalıp client timeout yiyebiliyor.
# __DEV__ + proxy → telefonda saniyeler içinde çözüm (Vision OCR + aritmetik).
#
# Kullanım:
#   bash scripts/phone-demo-proxy-mac.sh
#   # sonra Metro’yu yeniden başlat:
#   bash scripts/phone-dev-build.sh metro
#
# Gerekli: GOOGLE_CLOUD_VISION_API_KEY (env veya apps/mobile/.env.local)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
ENV_LOCAL="$MOBILE/.env.local"
PROXY_DIR="$ROOT/scripts/solve-proxy"
PORT="${SOLVE_PROXY_PORT:-8787}"
TOKEN="${COZBIL_PROXY_TOKEN:-cozbil-phone-demo-$(date +%Y%m%d)}"
LOG="${COZBIL_PROXY_LOG:-/tmp/cozbil-phone-solve-proxy.log}"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "HATA: Yalnız macOS. Bu host: $(uname -s)" >&2
  exit 1
fi

export PATH="/opt/homebrew/opt/node@22/bin:/usr/local/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

# Load Vision key from .env.local if present
if [[ -f "$ENV_LOCAL" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_LOCAL"
  set +a
fi

if [[ -z "${GOOGLE_CLOUD_VISION_API_KEY:-}" ]]; then
  echo "HATA: GOOGLE_CLOUD_VISION_API_KEY yok." >&2
  echo "apps/mobile/.env.local içine ekle veya export et (Vision API key)." >&2
  exit 1
fi

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [[ -z "$LAN_IP" ]]; then
  echo "HATA: Wi‑Fi IP bulunamadı (en0/en1)." >&2
  exit 1
fi

PROXY_URL="http://${LAN_IP}:${PORT}"

echo "==> LAN: $LAN_IP"
echo "==> Proxy URL: $PROXY_URL"
echo "==> Token: (gizli, .env.local’e yazılacak)"

# Stop previous listener on port if ours
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "==> Port $PORT dolu — eski process durduruluyor"
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t | xargs kill 2>/dev/null || true
  sleep 1
fi

cd "$PROXY_DIR"
if [[ ! -d node_modules ]]; then
  echo "==> npm install (solve-proxy)"
  npm install --silent
fi

echo "==> solve-proxy başlıyor → $LOG"
nohup env \
  COZBIL_PROXY_DOGFOOD=1 \
  COZBIL_PROXY_TOKEN="$TOKEN" \
  COZBIL_PROXY_ALLOW_LOOPBACK_IMAGES=1 \
  GOOGLE_CLOUD_VISION_API_KEY="$GOOGLE_CLOUD_VISION_API_KEY" \
  SOLVE_PROXY_PORT="$PORT" \
  node server.mjs >"$LOG" 2>&1 &
echo $! >/tmp/cozbil-phone-solve-proxy.pid
sleep 1

if ! curl -fsS -m 5 "http://127.0.0.1:${PORT}/health" | grep -q cozbil-solve-proxy; then
  echo "HATA: proxy health fail. Log:" >&2
  tail -40 "$LOG" >&2 || true
  exit 1
fi

# Upsert proxy lines into .env.local (keep Firebase keys)
touch "$ENV_LOCAL"
umask 077
tmp="$(mktemp)"
grep -vE '^EXPO_PUBLIC_SOLVE_PROXY_(URL|TOKEN)=' "$ENV_LOCAL" >"$tmp" || true
{
  cat "$tmp"
  echo "EXPO_PUBLIC_SOLVE_PROXY_URL=${PROXY_URL}"
  echo "EXPO_PUBLIC_SOLVE_PROXY_TOKEN=${TOKEN}"
} >"$ENV_LOCAL"
rm -f "$tmp"

echo ""
echo "✓ Proxy ayakta: $PROXY_URL"
echo "✓ Yazıldı: $ENV_LOCAL (SOLVE_PROXY_*)"
echo ""
echo "Şimdi (zorunlu — Expo env’i build-time okur):"
echo "  1) Metro’yu durdur (Ctrl+C)"
echo "  2) bash scripts/phone-dev-build.sh metro"
echo "  3) Telefonda uygulamayı kapat/aç → Çöz"
echo ""
echo "Not: Telefon Mac ile AYNI Wi‑Fi’de olmalı. VPN kapalı."
echo "Durdurmak: kill \$(cat /tmp/cozbil-phone-solve-proxy.pid)"
