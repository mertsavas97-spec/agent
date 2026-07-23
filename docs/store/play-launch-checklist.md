# Google Play — MVP 1.0 Launch Checklist

> Kaynak: `docs/audits/mvp-1.0-launch-ready-audit-2026-07-20.md`  
> Hedef paket: `com.cozbil.app`

## P0 — Submit engeli

- [ ] EAS `owner` + `extra.eas.projectId` dolu (`apps/mobile/app.json`) — **owner:** `eas init` (`docs/setup/EAS_PRODUCTION.md`)
- [x] Production EAS profile iskeleti: AAB + store + env (**no** solve proxy; sandbox off) — `apps/mobile/eas.json`
- [x] `app.config.js` production’da `expo-dev-client` strip
- [ ] `eas submit` / Play service account credentials
- [ ] Play Console app kaydı + imza (Play App Signing)
- [x] Store listing **metin taslağı** (title/short/full) — `docs/store/listing-copy-draft-tr.md` + ASO map
- [ ] Store listing **görseller**: screenshots + **feature graphic 1024×500**
- [ ] Privacy Policy **public HTTPS URL** canlı deploy — artefact hazır; runbook: `docs/store/hosting-deploy-runbook.md` (`firebase login --reauth`)
- [x] Data Safety doldurma taslağı: `docs/store/play-data-safety-draft.md`
- [x] Content rating questionnaire **taslağı**: `docs/store/play-content-rating-draft.md`
- [ ] Content rating Console’da gönderildi
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
