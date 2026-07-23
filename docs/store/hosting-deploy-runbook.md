# Firebase Hosting — privacy + terms deploy runbook

**Durum (2026-07-23):** Artefact hazır (`hosting/public/privacy` + `hosting/public/terms`).  
`firebase.json` rewrite: `/privacy` ve `/terms`.  
Deploy **bloklu**: `firebase login` / reauth gerekir (cloud agent’ta credential yok).

## Beklenen URL’ler

- `https://cozbil-dev-f9583.web.app/privacy`
- `https://cozbil-dev-f9583.web.app/terms`

## Owner (tek komut)

```bash
cd /path/to/repo
npx firebase-tools login --reauth   # bir kez
bash scripts/deploy-hosting-legal.sh
```

## Owner (manuel)

```bash
cd /path/to/repo
npx firebase-tools login --reauth
npx firebase-tools use cozbil-dev-f9583
npx firebase-tools deploy --only hosting
curl -sI https://cozbil-dev-f9583.web.app/privacy | head -5
curl -sI https://cozbil-dev-f9583.web.app/terms | head -5
```

## Doğrulama

- [ ] HTTPS 200 — `/privacy` ve `/terms`
- [ ] Sayfalar TR taslağını gösteriyor
- [ ] EAS production: `EXPO_PUBLIC_PRIVACY_POLICY_URL` + `EXPO_PUBLIC_TERMS_URL` bu URL’lere işaret ediyor

## Counsel

Deploy ≠ hukuki onay. HTML çalışma taslağıdır; avukat imzası sonrası metin güncellenir, tekrar deploy.
