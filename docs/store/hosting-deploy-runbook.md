# Firebase Hosting — privacy + terms + app-ads.txt deploy runbook

**Durum (2026-07-30):** Artefact hazır (`hosting/public/privacy` + `terms` + `app-ads.txt`).  
`firebase.json`: `/privacy`, `/terms` rewrite; `/app-ads.txt` → `text/plain`.  
Deploy **bloklu**: `firebase login` / reauth gerekir (cloud agent’ta credential yok).

## Beklenen URL’ler

- `https://cozbil-dev-f9583.web.app/privacy`
- `https://cozbil-dev-f9583.web.app/terms`
- `https://cozbil-dev-f9583.web.app/app-ads.txt` ← AdMob doğrulama

AdMob runbook: `docs/store/app-ads-txt.md`

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
curl -s https://cozbil-dev-f9583.web.app/app-ads.txt
APP_ADS_LIVE=1 bash scripts/check-app-ads-txt.sh
```

## Doğrulama

- [ ] HTTPS 200 — `/privacy` ve `/terms`
- [ ] HTTPS 200 — `/app-ads.txt` (`text/plain`, AdMob publisher satırı)
- [ ] ASC/Play developer website = `https://cozbil-dev-f9583.web.app`
- [ ] EAS production: `EXPO_PUBLIC_PRIVACY_POLICY_URL` + `EXPO_PUBLIC_TERMS_URL` bu URL’lere işaret ediyor

## Counsel

Deploy ≠ hukuki onay. HTML çalışma taslağıdır; avukat imzası sonrası metin güncellenir, tekrar deploy.
