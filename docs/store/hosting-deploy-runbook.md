# Firebase Hosting — privacy deploy runbook

**Durum (2026-07-22):** Artefact hazır (`hosting/public/privacy`).  
Deploy **bloklu**: `firebase login` / reauth gerekir (cloud agent’ta credential yok).

## Beklenen URL

`https://cozbil-dev-f9583.web.app/privacy`

## Owner adımları (Mac / Desktop)

```bash
cd /path/to/agent   # repo root
npx firebase-tools login --reauth
npx firebase-tools use cozbil-dev-f9583
npx firebase-tools deploy --only hosting
curl -sI https://cozbil-dev-f9583.web.app/privacy | head -5
```

## Doğrulama

- [ ] HTTPS 200
- [ ] Sayfa TR gizlilik taslağını gösteriyor
- [ ] `EXPO_PUBLIC_PRIVACY_POLICY_URL` bu URL’ye işaret ediyor (EAS production env)

## Counsel

Deploy ≠ hukuki onay. `hosting/public/privacy/index.html` çalışma taslağıdır;  
avukat imzası sonrası metin güncellenir, tekrar deploy.
