#!/usr/bin/env bash
# Mac: şahsi telefon demosu için yerel solve-proxy (Cloud Functions AI beklemeden)
#
# Neden: Canlı Firestore solve sıkça 40–60s+ sürüyor veya takılıyor; ping 403
# olsa bile Storage trigger "running" kalıp client timeout yiyebiliyor.
# __DEV__ + proxy → fotoğrafı Gemini ile çöz (birincil); OCR+yerel solver yedek.
#
# Kullanım:
#   bash scripts/phone-demo-proxy-mac.sh
#   # sonra Metro’yu yeniden başlat:
#   bash scripts/phone-dev-build.sh metro
#
# Gerekli:
#   GEMINI_API_KEY (birincil — yoksa Vision key ile dene)
#   GOOGLE_CLOUD_VISION_API_KEY (OCR yedek; env veya apps/mobile/.env.local)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE="$ROOT/apps/mobile"
ENV_LOCAL="$MOBILE/.env.local"
PROXY_DIR="$ROOT/scripts/solve-proxy"
PORT="${SOLVE_PROXY_PORT:-8787}"
# Stable default — must match apps/mobile SOLVE_PROXY_DOGFOOD_TOKEN (Metro auto-fallback).
TOKEN="${COZBIL_PROXY_TOKEN:-cozbil-phone-demo}"
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
  echo "==> Vision key yok — gcloud ile yazılıyor…"
  bash "$ROOT/scripts/write-vision-api-key-local.sh"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_LOCAL"
  set +a
fi

if [[ -z "${GOOGLE_CLOUD_VISION_API_KEY:-}" ]]; then
  echo "HATA: GOOGLE_CLOUD_VISION_API_KEY yok." >&2
  echo "bash scripts/write-vision-api-key-local.sh" >&2
  exit 1
fi

# Gemini is required for reliable photo solve (Vision-only keys cannot call Gemini).
if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  if [[ -f "$ENV_LOCAL" ]] && grep -qE '^GEMINI_API_KEY=AIza' "$ENV_LOCAL" 2>/dev/null; then
    set -a
    # shellcheck disable=SC1090
    source "$ENV_LOCAL"
    set +a
  fi
fi
if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "==> GEMINI_API_KEY yok — yazılıyor (Generative Language)…"
  # set -e does NOT abort on failure inside if — force exit
  bash "$ROOT/scripts/write-gemini-api-key-local.sh" || {
    echo "HATA: Gemini key yazılamadı — proxy başlatılmıyor." >&2
    exit 1
  }
  set -a
  # shellcheck disable=SC1090
  source "$ENV_LOCAL"
  set +a
fi
if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "HATA: GEMINI_API_KEY yok. OCR-only moda düşme — solve kırılır." >&2
  echo "bash scripts/write-gemini-api-key-local.sh" >&2
  exit 1
fi

# Reject Vision-only / dead keys before starting proxy
echo "==> Gemini key smoke…"
GEMINI_SMOKE_HTTP="$(
  curl -sS -o /tmp/cozbil-proxy-gemini-smoke.json -w '%{http_code}' \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}" \
    -H 'Content-Type: application/json' \
    -d '{"contents":[{"parts":[{"text":"Reply with JSON only: {\"ok\":true}"}]}]}' \
    --max-time 30 || echo "000"
)"
if [[ "$GEMINI_SMOKE_HTTP" != "200" ]]; then
  echo "HATA: .env.local GEMINI_API_KEY smoke HTTP $GEMINI_SMOKE_HTTP" >&2
  head -c 300 /tmp/cozbil-proxy-gemini-smoke.json 2>/dev/null >&2 || true
  echo "" >&2
  echo "Vision-only key olabilir. Şunu çalıştır:" >&2
  echo "  FORCE_NEW_GEMINI_KEY=1 bash scripts/write-gemini-api-key-local.sh" >&2
  exit 1
fi
echo "==> Gemini Vision solve: AÇIK (birincil yol) — smoke OK"

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
# Stale node_modules (pre-sharp) used to skip install and crash on import.
if [[ ! -d node_modules/sharp ]] || [[ ! -d node_modules/tesseract.js ]]; then
  echo "==> npm install (solve-proxy — sharp/tesseract)"
  npm install
fi
if ! node -e "import('sharp').then(()=>process.exit(0)).catch(()=>process.exit(1))"; then
  echo "==> sharp resolve fail — npm install yeniden"
  rm -rf node_modules
  npm install
fi
if ! node -e "import('sharp').then(()=>process.exit(0)).catch(()=>process.exit(1))"; then
  echo "HATA: sharp kurulamadı. Elle: cd scripts/solve-proxy && npm install" >&2
  exit 1
fi

echo "==> solve-proxy başlıyor → $LOG"
: >"$LOG"
nohup env \
  COZBIL_PROXY_DOGFOOD=1 \
  COZBIL_PROXY_TOKEN="$TOKEN" \
  COZBIL_PROXY_ALLOW_LOOPBACK_IMAGES=1 \
  GOOGLE_CLOUD_VISION_API_KEY="$GOOGLE_CLOUD_VISION_API_KEY" \
  GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
  COZBIL_PROXY_GEMINI_FIRST="${COZBIL_PROXY_GEMINI_FIRST:-1}" \
  SOLVE_PROXY_PORT="$PORT" \
  node server.mjs >"$LOG" 2>&1 &
echo $! >/tmp/cozbil-phone-solve-proxy.pid
# sharp/native load can take a beat on first start
for _ in 1 2 3 4 5 6 7 8; do
  if curl -fsS -m 2 "http://127.0.0.1:${PORT}/health" 2>/dev/null | grep -q cozbil-solve-proxy; then
    break
  fi
  sleep 0.5
done

if ! curl -fsS -m 5 "http://127.0.0.1:${PORT}/health" | grep -q cozbil-solve-proxy; then
  echo "HATA: proxy health fail. Log:" >&2
  tail -40 "$LOG" >&2 || true
  echo "" >&2
  echo "Hızlı düzeltme: cd scripts/solve-proxy && rm -rf node_modules && npm install" >&2
  exit 1
fi

# Upsert proxy lines into .env.local AND .env (Expo/Metro ikisini de okur)
upsert_proxy_env() {
  local file="$1"
  touch "$file"
  local tmp
  tmp="$(mktemp)"
  grep -vE '^EXPO_PUBLIC_SOLVE_PROXY_(URL|TOKEN)=' "$file" >"$tmp" || true
  {
    cat "$tmp"
    echo "EXPO_PUBLIC_SOLVE_PROXY_URL=${PROXY_URL}"
    echo "EXPO_PUBLIC_SOLVE_PROXY_TOKEN=${TOKEN}"
  } >"$file"
  rm -f "$tmp"
}

umask 077
upsert_proxy_env "$ENV_LOCAL"
upsert_proxy_env "$MOBILE/.env"

# Most reliable for Expo device: importable TS module (Metro always sees it)
PROXY_TS="$MOBILE/src/config/solveProxy.dev.local.ts"
cat >"$PROXY_TS" <<EOF
/**
 * AUTO-GENERATED by scripts/phone-demo-proxy-mac.sh — do not commit secrets.
 */
export const solveProxyDevLocal: { url: string; token: string } = {
  url: '${PROXY_URL}',
  token: '${TOKEN}',
};
EOF
echo "==> Yazıldı: $PROXY_TS"

# Smoke from LAN bind
if ! curl -fsS -m 5 "${PROXY_URL}/health" | grep -q cozbil-solve-proxy; then
  echo "UYARI: LAN health (${PROXY_URL}) başarısız — firewall / Wi‑Fi ayarını kontrol et." >&2
  echo "       Localhost health OK ise Mac firewall 8787’yi engelliyor olabilir." >&2
fi

echo ""
echo "✓ Proxy ayakta: $PROXY_URL"
echo "✓ Gemini Vision solve: ${GEMINI_API_KEY:+AÇIK}${GEMINI_API_KEY:-KAPALI}"
echo "✓ Env: .env.local + .env"
echo "✓ Bundle: src/config/solveProxy.dev.local.ts"
echo ""
echo "ŞİMDİ (zorunlu):"
echo "  1) Metro’yu Ctrl+C ile DURDUR"
echo "  2) bash scripts/phone-dev-build.sh metro"
echo "  3) Telefonda uygulamayı kapat/aç"
echo "  4) Metro: solve: bounded OCR proxy"
echo "  5) Proxy log: solve-proxy gemini-vision   (tail -f $LOG)"
echo ""
echo "Hâlâ 'proxy off' ise: bash scripts/check-phone-demo-env.sh"
echo "Durdurmak: kill \$(cat /tmp/cozbil-phone-solve-proxy.pid)"
