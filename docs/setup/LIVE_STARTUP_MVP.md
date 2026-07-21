# MVP 1.0 Canlı — Google Cloud Startup kredisi

Tüm AI maliyeti **aynı GCP faturalandırma hesabına** (Startup) gider:

| Servis | Yol | Env |
|--------|-----|-----|
| Soru çözme (Gemini) | **Vertex AI** `gemini-2.5-flash` | `COZBIL_USE_VERTEX=1` |
| Anlamadım | Vertex (aynı) | ↑ |
| SafeSearch (Vision) | **ADC** (API key opsiyonel) | Vertex açıkken key gerekmez |
| Firebase | `cozbil-dev-f9583` | Blaze + Startup billing |

AI Studio `GEMINI_API_KEY` **kullanma** — prepay cüzdanı Startup’tan ayrı.

## Owner — tek seferlik (Mac veya Cloud Agent)

```bash
cd /path/to/agent
bash scripts/gcp-startup-live-setup.sh          # login + API + env
bash scripts/gcp-startup-live-setup.sh --deploy # + deploy + ping
bash scripts/fix-functions-invoker.sh           # telefon 403 fix
```

Login sırasında tarayıcıda **Startup kredili Google hesabını** seç.

## Mobil `.env`

`apps/mobile/.env` — Firebase web config (Console → Project settings):

```
EXPO_PUBLIC_FIREBASE_API_KEY=<web api key>
EXPO_PUBLIC_FIREBASE_APP_ID=<web app id>
EXPO_PUBLIC_USE_EMULATORS=0
```

`EXPO_PUBLIC_SOLVE_PROXY_URL` — yalnızca org-policy 403 bypass; canlıda gerekmez.

## Doğrulama

```bash
curl -s "https://europe-west1-cozbil-dev-f9583.cloudfunctions.net/ping" | jq .
```

Beklenen:

```json
{
  "aiMode": "live",
  "aiBackend": "vertex",
  "visionBackend": "adc",
  "vertex": true,
  "billingNote": "Gemini+Vision → linked GCP billing (Startup credits)"
}
```

## Proje sabitleri

| | |
|--|--|
| Project ID | `cozbil-dev-f9583` |
| Billing | `01F6A9-B52CDE-B4D709` |
| Functions | `europe-west1` |
| Vertex | `us-central1` |

Detay: [`VERTEX_STARTUP.md`](./VERTEX_STARTUP.md)
