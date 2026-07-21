# Google Play — MVP 1.0 Launch Checklist

> Kaynak: `docs/audits/mvp-1.0-launch-ready-audit-2026-07-20.md`  
> Hedef paket: `com.cozbil.app`

## P0 — Submit engeli

- [ ] EAS `owner` + `extra.eas.projectId` dolu (`apps/mobile/app.json`)
- [ ] Production EAS profile: AAB, env (Firebase, **no** `EXPO_PUBLIC_SOLVE_PROXY_URL`), `expo-dev-client` production’dan çıkarıldı
- [ ] `eas submit` / Play service account credentials
- [ ] Play Console app kaydı + imza (Play App Signing)
- [ ] Store listing: title, short desc (80), full desc, screenshots (phone + 7" tablet önerilir), **feature graphic 1024×500**
- [ ] Privacy Policy **public HTTPS URL** canlı deploy (`hosting/` hazır → `firebase login --reauth` + `npx firebase-tools deploy --only hosting`; beklenen `https://cozbil-dev-f9583.web.app/privacy`) + Data Safety formu
- [x] Data Safety doldurma taslağı: `docs/store/play-data-safety-draft.md`
- [ ] Content rating questionnaire (education + photo upload + AI + minors LGS)
- [ ] Play Billing product IDs in Console: `cozbil_premium_weekly_intro|monthly|yearly` + license testers
- [x] Server token verify path (`syncSubscription` + `verifyPlayPurchase`) — credentials owner’da
- [x] Production’da local `activateLocalPremium` kapalı / only `__DEV__` + sandbox env
- [x] In-app KVKK / gizlilik / şartlar + support email hook (counsel onay hâlâ owner)
- [ ] KVKK counsel imzalı final metin
- [ ] Firestore + Storage rules prod publish smoke
- [ ] Org-policy: callable veya Storage/Firestore path production’da çalışıyor (proxy production edge değil)
- [ ] Typecheck + mobile/functions tests yeşil (typecheck 2026-07-20 fixlendi)

## P1 — Soft launch öncesi

- [x] Yaş bandı / veli onayı onboarding UI (sınavdan bağımsız)
- [ ] Account deletion hard purge pipeline
- [ ] AdMob: SDK + child-directed flags **veya** ads UI’yı “yakında” diye gizle
- [ ] Analytics events (onboarding, solve, paywall, purchase)
- [ ] Item bank ~50–60 + T070 guardian
- [ ] Dogfood raporu T063
- [x] Pricing tek kaynak (**320 TL/yıl** — Sprint 1 SSoT 2026-07-21)
- [x] Scope kararı: Ehliyet MVP 1.0’da (store + onboarding)

## P2

- [ ] In-app review prompt
- [ ] CI: typecheck/test/lint/audit
- [ ] npm moderate uuid chain plan
