# ÇözBil MVP 1.0 — Launch-Ready Audit (Android + iOS)

**Tarih:** 2026-07-20  
**Karar:** **NO-GO** mağaza yayını için (P0 engeller açık). Dogfood / internal preview için kısmen GO.  
**Koordinatör:** `.cursor/rules/000-coordinator.mdc`  
**Spec:** `specs/002-cozbil-mvp/` + `docs/product/cozbil-mvp-1.0-brief.md`

## Kullanılan repo / skill / agent setleri

| Set | Kullanım |
|-----|----------|
| **spec-kit** | `specs/001-*`, `specs/002-cozbil-mvp/{spec,plan,tasks}.md`, constitution |
| **marketingskills** | product-marketing, aso, launch, paywalls, pricing, competitor-profiling, copywriting |
| **designer + ui-ux** | designer.mdc; ui-ux-pro-max skill **workspace’te yok** → design briefs/tokens/moodboard kullanıldı |
| **architect** | architect.mdc + architecture docs + Functions/proxy/mobile |
| **qa-tester** | systematic verify: tests PASS; typecheck FAIL→**fixed this sprint** |
| **security-reviewer** | security docs + rules + ai-security skill lens |
| **alirezarezvani / business** | pricing-strategy / pricing-strategist skill paths (WTP/benchmark gap notasyonu) |

## Executive verdict

| Alan | Skor (0–5) | Not |
|------|------------|-----|
| Core solve loop (dogfood) | 4 | Proxy + isolation + UI güçlü |
| Production AI path | 2 | Org policy / dual pipeline |
| Monetization / IAP | 1 | Local stub |
| Store listing / ASO | 1 | Metadata + screenshots yok |
| Legal / KVKK / minors | 1 | Taslak copy |
| UX polish | 3.5 | Premium hissi iyi; dark/a11y/haptics eksik |
| Security (prod posture) | 2.5 | Rules iyi; proxy/entitlement P0 |
| Test automation | 4 | Mobile 157 + Functions 68 + proxy tests |
| **Overall launch-ready** | **1.5** | Play soft-launch için P0 kapanmalı |

### P0 engeller (özet)

1. Play Billing / StoreKit + server entitlement (local premium bypass)  
2. KVKK / privacy URL / counsel + LGS guardian modeli  
3. EAS `owner` / `projectId` + production submit; `expo-dev-client` prod’dan çıkar  
4. Store listing paketi (screenshots, feature graphic, TR metadata) — **app icon assets mevcut** (`apps/mobile/assets/images/*`)  
5. Production solve path: org-policy callable veya güvenli trigger; **proxy auth’sız production edge olamaz**  
6. Spec vs code: yıllık fiyat **349 vs 279**; Ehliyet scope kararı  
7. ~~Typecheck kırmızı~~ → **bu branch’te yeşile alındı** (`BootstrapGate`, `examModeGuard` test)

---

## 1. Product Strategy

| ID | Sev | Platform | Bulgu | Kanıt | Aksiyon |
|----|-----|----------|-------|-------|---------|
| PS-01 | P0 | Both | MVP scope: spec LGS/YGS/KPSS; app + Ehliyet | `specs/002`, `examTypes.ts`, onboarding copy | Scope kilitle veya spec güncelle |
| PS-02 | P0 | Both | Yıllık fiyat 349 (spec) vs 279 (policy/code) | `spec.md`, `pricing-policy.md`, `pricing.ts` | Tek SSoT |
| PS-03 | P1 | Both | Marka/domain/store adı TBD | brief | Availability + trademark |
| PS-04 | P1 | Both | Rakip analizi yüzeysel | brief isimler | competitor-profiling ile store/web |
| PS-05 | P2 | Both | Canonical marketing context yoktu | `.agents/product-marketing.md` **oluşturuldu** | Owner review |
| PS-06 | P1 | Both | Item bank 10/54 | `mvp-1.0.json`, T067 | 50–60 item |
| PS-07 | P2 | Both | “YGS” vs YKS discovery | exam tree docs | Store’da YKS/TYT |
| PS-08 | P1 | Both | Launch KPI/PMF yok | — | D1/D7, paywall CVR, first solve |
| PS-09 | P0 | Both | KVKK hukuki unchecked | brief, `legalCopy.ts` | Counsel |

**Problem–Solution / VP / Positioning:** Brief ile uyumlu; execution dogfood’ta güçlü.  
**Market fit:** Türkiye education AI; kanıtlı retention/monetization henüz yok.  
**Business model:** Freemium + ads + subscription — doğru; billing stub.  
**Roadmap / vision:** 1.1 veli, 1.2 spaced rep — tutarlı; Ehliyet 1.0’a sızmış.

---

## 2. UX Audit

| ID | Sev | Platform | Bulgu | Kanıt |
|----|-----|----------|-------|-------|
| UX-01 | P1 | Both | IA drift: 5 tab + Ehliyet vs moodboard 4 tab / 3 sınav | `(tabs)/_layout.tsx`, moodboard |
| UX-02 | P1 | Both | Onboarding yaş sormuyor; LGS→otomatik parentalConsent | `OnboardingFlow.tsx` |
| UX-03 | P2 | Both | Exam switch Settings + ad-gated | `ActiveExamBadge`, settings |
| UX-04 | P2 | Both | Solve error çoğunlukla “Ana sayfa” | `solve.tsx` |
| UX-05 | P2 | Both | Search yok | topics/history filters only |
| UX-06 | P2 | Both | Share/viral loop yok | — |
| UX-07 | P2 | Both | Empty states tutarsız | Home vs `EmptyState` |
| UX-08 | P2 | Both | Push prefs stub (FCM yok) | `pushPrefs.ts` |

**Journey / cognitive load:** Capture → analyze → (mismatch/subject) → solution güçlü; secondary surfaces (settings exam, premium sandbox) friction.  
**Retention/habit:** Streak + push copy var; delivery yok.

---

## 3. UI / Visual Design

| ID | Sev | Platform | Bulgu | Kanıt |
|----|-----|----------|-------|-------|
| UI-01 | P1 | Both | Dark mode yok (`userInterfaceStyle: light`) | `app.json`, hardcode colors |
| UI-02 | P1 | Both | Token drift (exam teal/blue vs navy/orange doc) | `examTheme.ts`, `tokens.md` |
| UI-03 | P2 | Both | Haptics yok | — |
| UI-04 | P2 | Both | Reduce-motion yok | `CozbilRobot`, `AnalyzingView` |
| UI-05 | P2 | Both | Font scaling sınırlı | fixed sizes |
| UI-06 | P2 | Both | Sandbox/paywall prod hissi kırıyor | `premium.tsx` |
| UI-07 | P3 | Both | Güçlü: Poppins, robot, answer hero, paywall hierarchy | — |

---

## 4. Onboarding

| ID | Sev | Platform | Bulgu |
|----|-----|----------|-------|
| ON-01 | P1 | Both | Scope copy Ehliyet içeriyor |
| ON-02 | P0 | Both | KVKK “taslak / yakında” |
| ON-03 | P1 | Both | Minor/veli tek checkbox, yaş yok |
| ON-04 | P2 | Both | Camera permission education CTA anında |
| ON-05 | P2 | Both | TTV iyi (3 adım + local unlock) |
| ON-06 | P2 | Both | Demo onboarding reset Settings’te görünür |

**Activation:** First-solve &lt;60s hedefi lab’da mümkün; store funnel ölçülmüyor.

---

## 5. Core Features (özet skor)

Ölçek: usefulness / discoverability / usability / delight / completion / scalability / edges — her biri 1–5.

| Feature | U / D / Us / De / C / Sc / E | Not |
|---------|------------------------------|-----|
| Home | 4/4/4/3/4/3/3 | CTA net; empty polish |
| Search | 1/1/1/1/1/1/1 | Yok |
| AI / Solve | 5/4/4/4/4/3/3 | Core; error recovery + dual pipeline |
| Profile | 3/3/3/2/3/3/3 | Delete soft |
| Settings | 3/3/3/2/3/3/2 | Push stub; demo reset |
| Premium | 4/4/3/3/2/2/2 | UI iyi; billing stub |
| Sharing | 1/1/1/1/1/1/1 | Yok |
| Notifications | 2/3/3/2/1/2/2 | Prefs only |
| Topics / Samples | 4/3/4/3/3/3/3 | Bank hacim P1 |
| History / Stats | 4/3/4/3/4/3/3 | Local+server merge |

---

## 6. AI Audit

| ID | Sev | Bulgu | Kanıt |
|----|-----|-------|-------|
| AI-01 | P1 | Proxy-first dogfood ≠ Vertex production davranışı | `solveClient.ts` |
| AI-02 | P1 | Local fallback `status: solved` generic | `localSolveFallback.ts` |
| AI-03 | P1 | Vertex choice/answer verification zayıf (proxy math daha iyi) | gemini vs arith |
| AI-04 | P2 | Temperature/generationConfig yok | `vertexClient.ts` |
| AI-05 | P2 | Streaming yok | — |
| AI-06 | P2 | Türkçe/other subject prompt derinliği ince | `prompts/turkish/stubs` |
| AI-07 | P2 | Progress → prompt personalization yok | — |
| AI-08 | P2 | Eval harness / bank kalitesi açık | PIPELINE_AI_AUDIT |
| AI-09 | P3 | No RAG/memory (by design MVP) | exam-ai-strategy |
| AI-10 | — | Teacher router + few-shots + JSON schema + transparency | `prompts.ts` |
| AI-11 | — | Retry JSON repair 1×; Vertex 20s; cache phash | — |
| AI-12 | P2 | phash perceptual değil | `cache/phash.ts` |

**Guardrails:** SafeSearch Functions fail-closed (iyi); proxy’de yok (P0 prod).  
**Cost:** quota 5/day, RL, cache, stub-no-poison.

---

## 7. Algorithm Audit

| ID | Sev | Bulgu |
|----|-----|-------|
| AL-01 | — | OCR subject scoring + verbal scoring (proxy) |
| AL-02 | P2 | Weakest topic server ≠ client |
| AL-03 | — | Streak Istanbul day |
| AL-04 | — | `placeCorrectAt` answer-key rotation |
| AL-05 | — | Exam pipeline isolation trafik ↔ academic (**fixed**) |
| AL-06 | P3 | No recsys / spaced repetition (1.2) |
| AL-07 | P3 | listAttempts filter-in-memory 100 |

---

## 8. Technical Architecture

| ID | Sev | Bulgu |
|----|-----|-------|
| TA-01 | — | Expo RN feature modules + Functions + Firestore + optional proxy |
| TA-02 | P1 | Org-policy dual pipeline debt |
| TA-03 | P2 | Offline partial (local history/fallback; no sync protocol) |
| TA-04 | P3 | No Redux/Zustand — AsyncStorage + memory OK MVP |
| TA-05 | P2 | Batch concurrency 1 |
| TA-06 | — | Firestore rules ownership strong |

---

## 9. Performance

| ID | Sev | Bulgu |
|----|-----|-------|
| PF-01 | P2 | Full base64 proxy payloads (≤6MB) |
| PF-02 | P2 | Sequential multi-solve |
| PF-03 | P3 | No expo-image / FPS budgets / launch telemetry |
| PF-04 | — | Image quality 0.85; history cap 80 |
| PF-05 | P2 | Vertex 20s hard abort vs UX wait |

**Ölçüm:** Repo’da launch/FPS/memory CI budget yok — store öncesi device profiling şart.

---

## 10. Backend Audit

| ID | Sev | Bulgu |
|----|-----|-------|
| BE-01 | P0 | Callable phone path org-policy 403 risk |
| BE-02 | P0 | Proxy CORS `*` + no auth (dogfood only) |
| BE-03 | — | Auth uid, path ownership, claim transaction |
| BE-04 | — | Daily quota + persistent RL + soft restrict |
| BE-05 | P1 | Subscription sync stub |
| BE-06 | P2 | No Sentry/OTel |
| BE-07 | P2 | solveRequests keys allow-list gevşek (`hasAll` vs `hasOnly`) |
| BE-08 | P3 | No Cloud Tasks queue |

---

## 12. Security

| ID | Sev | Bulgu |
|----|-----|-------|
| SEC-01 | P0 | Unauthenticated solve proxy |
| SEC-02 | P0 | Local premium activation |
| SEC-03 | P0 | KVKK drafts |
| SEC-04 | P1 | Guardian/age weak |
| SEC-05 | P1 | Account deletion soft-only |
| SEC-06 | P1 | Public download URL retention |
| SEC-07 | P1 | Prompt injection fixtures eksik |
| SEC-08 | P1 | OCR preview in proxy logs |
| SEC-09 | P2 | rateLimits TTL yok |
| SEC-10 | P3 | EXPO_PUBLIC Firebase OK (not secret) |

---

## 14. Growth

| ID | Sev | Bulgu |
|----|-----|-------|
| GR-01 | P0 | Store metadata artefaktı yok |
| GR-02 | P0 | Screenshots + Play feature graphic yok (**icons mevcut**) |
| GR-03 | P0 | EAS projectId/owner boş; submit.production boş |
| GR-04 | P1 | iOS launch scope belirsiz |
| GR-05 | P2 | Review prompt yok |
| GR-06 | P2 | Referral/share yok |
| GR-07 | P1 | “Binlerce…” sosyal kanıt |
| GR-08 | P1 | Analytics funnel yok |
| GR-09 | P1 | AdMob SDK yok (policy var) |
| GR-10 | P1 | ASO keyword pack yok |

---

## 15. Monetization

| ID | Sev | Bulgu |
|----|-----|-------|
| MO-01–03 | P0 | IAP + server verify + local entitlement |
| MO-04 | P1 | Rewarded +1 grant sandbox |
| MO-05 | P2 | Trial vs paid week messaging |
| MO-06 | P1 | Restore/manage subscription incomplete |
| MO-07 | P1 | Revenue events yok |
| MO-08 | P2 | WTP/competitor price proof yok |
| MO-09 | P2 | “Sınırsız” vs fair-use |

---

## 16. Notification System

Prefs + copy var; **OS permission, FCM/APNs, scheduling, smart timing yok**.  
Re-engagement loop: **tasarım var, sistem yok** (P2 ürün / P1 store expectation).

---

## 17. Content Audit

- Tone: sıcak koç — iyi.  
- Microcopy: paywall “Sınavsız tempo” yanıltıcı (P2).  
- Localization: TR-only OK MVP; iOS/Play legal branch eksik.  
- AI writing: proxy heuristics iyi örneklerde; Vertex quality unmeasured at scale.  
- Overclaim: “Binlerce…” kaldır (P1).

---

## 18. Accessibility

| ID | Sev | Bulgu |
|----|-----|-------|
| A11Y-01 | P1 | Reduce motion yok |
| A11Y-02 | P2 | Pressable role/hint tutarsız |
| A11Y-03 | P2 | Modal focus / VoiceOver-TalkBack |
| A11Y-04 | P2 | Font scale / Dynamic Type |
| A11Y-05 | P2 | Touch target audit eksik |
| A11Y-06 | P2 | Contrast exam soft colors undoc |

---

## 19. QA

| ID | Sev | Durum |
|----|-----|-------|
| QA-01 | P0→fixed | Typecheck yeşil (bu branch) |
| QA-02 | — | Mobile tests PASS (önceki ölçüm ~157) |
| QA-03 | — | Functions tests PASS (~68) |
| QA-04 | — | Proxy isolation tests PASS |
| QA-05 | P1 | Lint script echo — CI gate yok |
| QA-06 | P1 | No GitHub Actions |
| QA-07 | P1 | Offline preflight zayıf; fallback “solved” |
| QA-08 | P1 | Memory/base64 large image |
| QA-09 | P1 | Rules publish manuel |
| QA-10 | P1 | T063 dogfood + T070 guardian açık |
| QA-11 | P2 | act() animation warnings |

**Device matrix (önerilen):** Android 10–15 low-RAM; iOS 16+ TestFlight; offline, permission deny, 8MB image, multi-batch 5.

---

## Store readiness matrix

| Madde | Android | iOS | Durum |
|-------|---------|-----|-------|
| Bundle/package ID | `com.cozbil.app` | same | OK |
| App icons / splash | assets present | same | OK (T062 brand polish open) |
| Screenshots / feature graphic | missing | missing | **P0** |
| Listing copy | missing | missing | **P0** |
| Privacy URL | missing | missing | **P0** |
| Data Safety / App Privacy | not filled | not filled | **P0** |
| IAP live | stub | stub | **P0** |
| EAS project | empty | empty | **P0** |
| Prod without dev-client | risk | risk | **P0** |
| ATT | N/A if no track | needed if ads track | P1 conditional |
| Privacy Manifest | — | missing verify | P1 |

Checklists: `docs/store/play-launch-checklist.md`, `docs/store/app-store-launch-checklist.md`.

---

## Öncelikli 30 günlük remediation (teknik sıra, takvim değil)

### Wave A — Store blockers
1. Scope + pricing SSoT  
2. Play Billing + server entitlement; kill prod local premium  
3. Privacy/KVKK URLs + guardian UX  
4. EAS prod config + AAB smoke  
5. Listing visuals + ASO TR pack  
6. Production solve without public proxy  

### Wave B — Trust / quality
7. Fallback status honesty  
8. Analytics + paywall events  
9. Item bank + guardian  
10. Dogfood T063 sign-off  

### Wave C — Polish
11. A11y/motion/haptics  
12. Dark mode decision  
13. Share + review prompt  
14. Push real or hide UI  
15. CI gates  

---

## Bu sprintte yapılan küçük P0 fix

- `StyleSheet.absoluteFillObject` → `absoluteFill` (`BootstrapGate.tsx`)  
- `examModeGuard` test status `unsupported_type` + required fields  
- `npx tsc --noEmit` → **0 errors**

---

## Açık / bekleyen

- T062 brand icon polish, T063 dogfood report, T067 bank fill, T070 guardian  
- IAP, legal, listing, EAS, analytics, AdMob, push  
- ui-ux-pro-max skill kurulumu (docs referans veriyor, repo’da yok)
