# Legal artefacts — ÇözBil

## Privacy (TR)

- Kaynak: [`privacy-tr.html`](./privacy-tr.html)
- Uygulama env: `EXPO_PUBLIC_PRIVACY_POLICY_URL` → public **HTTPS** URL

## Deploy (Firebase Hosting)

Repo’da `hosting/public/privacy/index.html` hazır. Proje: `cozbil-dev-f9583`.

```bash
cd /Users/mert/agent
npx firebase-tools login   # bir kez
npx firebase-tools deploy --only hosting --project cozbil-dev-f9583
```

Beklenen URL: `https://cozbil-dev-f9583.web.app/privacy`  
App env: `EXPO_PUBLIC_PRIVACY_POLICY_URL` (bkz. `apps/mobile/.env.example`).


## İlgili env

```bash
EXPO_PUBLIC_PRIVACY_POLICY_URL=https://example.com/privacy
EXPO_PUBLIC_SUPPORT_EMAIL=destek@cozbil.app
```
