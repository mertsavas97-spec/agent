# GCP / Firebase access + billing audit — 2026-07-21

## Auth
- `gcloud auth login` + ADC refreshed as `hello@summify.app`
- Firebase CLI logged in; project `cozbil-dev-f9583` current
- Anonymous Auth sign-up: OK

## Billing
- Project billing **enabled** → `billingAccounts/01F6A9-B52CDE-B4D709` (My Billing Account, OPEN, TRY)
- **Vertex AI** (`gemini-2.5-flash` @ `us-central1`): **OK** (Cloud Billing / Startup path)
- **AI Studio prepaid Gemini keys**: **depleted** — do not use for dogfood OCR/solve

## APIs
- Enabled Vision API (`vision.googleapis.com`) — was missing
- Enabled Secret Manager; stored `GOOGLE_CLOUD_VISION_API_KEY`
- Gemini API + Vertex (aiplatform) already enabled
- Cloud Functions / Firestore / Hosting / Storage enabled

## Functions (europe-west1)
- Deployed: `solveQuestion`, `onSolveRequestCreatedV2`, onboarding/progress callables, `ping`
- Env already: `COZBIL_USE_VERTEX=1`, `COZBIL_DEMO_AI=0`, Vision key present, Vertex model set

## Local dogfood proxy
- Uses Vision API key (not depleted AI Studio)
- Fallback: Tesseract → (optional Gemini)
- Solvers OK when OCR text present (math E/7 verified)

## Still not “production green”
- Phone Firebase callable can still return `unauthenticated` if client session missing (proxy bypasses this)
- AI Studio prepaid wallet still empty — recharge or ignore in favor of Vertex
- Prefer Vision/Vertex over AI Studio keys going forward
