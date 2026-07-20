# Google Play — MVP 1.0 Launch Checklist

> Kaynak: `docs/audits/mvp-1.0-launch-ready-audit-2026-07-20.md`  
> Hedef paket: `com.cozbil.app`

## P0 — Submit engeli

- [ ] EAS `owner` + `extra.eas.projectId` dolu (`apps/mobile/app.json`)
- [ ] Production EAS profile: AAB, env (Firebase, **no** `EXPO_PUBLIC_SOLVE_PROXY_URL`), `expo-dev-client` production’dan çıkarıldı
- [ ] `eas submit` / Play service account credentials
- [ ] Play Console app kaydı + imza (Play App Signing)
- [ ] Store listing: title, short desc (80), full desc, screenshots (phone + 7" tablet önerilir), **feature graphic 1024×500**
- [ ] Privacy Policy **public HTTPS URL** + Data Safety formu (kamera, fotoğraf/UGC, user ID, progress, purchases, ads if any)
- [ ] Content rating questionnaire (education + photo upload + AI + minors LGS)
- [ ] Play Billing product IDs: `cozbil_premium_week|monthly|yearly` + **server token verify** (stub kaldır)
- [ ] Production’da local `activateLocalPremium` kapalı / only `__DEV__`
- [ ] KVKK aydınlatma + counsel onay + support email
- [ ] Firestore + Storage rules prod publish smoke
- [ ] Org-policy: callable veya Storage/Firestore path production’da çalışıyor (proxy production edge değil)
- [ ] Typecheck + mobile/functions tests yeşil (typecheck 2026-07-20 fixlendi)

## P1 — Soft launch öncesi

- [ ] Yaş bandı / LGS veli onayı gerçek UI
- [ ] Account deletion hard purge pipeline
- [ ] AdMob: SDK + child-directed flags **veya** ads UI’yı “yakında” diye gizle
- [ ] Analytics events (onboarding, solve, paywall, purchase)
- [ ] Item bank ~50–60 + T070 guardian
- [ ] Dogfood raporu T063
- [ ] Pricing tek kaynak (279 vs 349)
- [ ] Scope kararı: Ehliyet store copy’de var mı?

## P2

- [ ] In-app review prompt
- [ ] CI: typecheck/test/lint/audit
- [ ] npm moderate uuid chain plan
