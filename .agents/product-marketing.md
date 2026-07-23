# ÇözBil — Product Marketing Context

> Auto-drafted 2026-07-20 from specs + codebase. Owner should correct before public store copy ships.

## 1. Product Overview
- **One-line:** Fotoğrafla soru çek, sınavına özel adım adım Türkçe çözüm al.
- **What it does:** Öğrenci/aday soru fotoğrafı çeker veya galeriden seçer; ÇözBil OCR + AI/heuristic pipeline ile adım adım çözüm, “Anlamadım” yeniden anlatım, geçmiş, zayıf konu istatistiği ve Premium sunar.
- **Category:** Education / Study tools / AI tutor (Türkiye sınavları).
- **Type:** Freemium mobile app (Android-first; iOS optional).
- **Working brand:** ÇözBil (final store/domain TBD — see brief).

## 2. Target Audience / ICP
- **LGS:** ~13–15 yaş; veli sıkça öder; kısa oturum, hızlı çözüm.
- **YGS (owner etiketi; resmi aile YKS/TYT-AYT):** lise / üniversite adayı.
- **KPSS:** yetişkin kamu personeli adayı.
- **Ehliyet/Trafik:** MVP 1.0 first-class (`examType=trafik`); store + onboarding dahil.

## 3. Problem & JTBD
- Takıldığı soruda hızlı, güvenilir, **Türkçe adım adım** çözüm yok.
- Global AI araçları Türk müfredatı / kitapçık formatına özel değil.
- JTBD: “Bu soruyu şimdi çözüp nerede eksiğim olduğunu anlayayım.”

## 4. Positioning & Differentiation
- **Positioning:** Türkiye’nin sınav odaklı AI çalışma arkadaşı — LGS, YGS, KPSS, Ehliyet; çözer, anlatır, eksiğini gösterir.
- **Differentiators (claimed):** exam-aware prompts/topics, şeffaflık notu, progress/weak topic, multi-exam tracks.
- **Not:** genel ChatGPT wrapper; diyagram render / spaced repetition / veli raporu 1.1+.

## 5. Offer & Pricing (single source of truth)
Canonical **policy + code + spec** (Sprint 1 lock 2026-07-21):
- Free: **5** solves/day + ads matrix
- Premium: **14,90 TL / 7 gün**, **39 TL / ay**, **320 TL / yıl** (`docs/product/pricing-policy.md`, `pricing.ts`)
- Stale **349 TL / yıl** brief claims removed.

## 6. Proof Points (current honesty)
- Dogfood / lab path works with solve-proxy + Firestore triggers.
- Do **not** claim “binlerce kullanıcı” until metrics exist (paywall copy currently overclaims — P1).

## 7. Brand Voice
- Warm Turkish student coach; navy + orange; Poppins; robot mascot.
- Avoid fear/FOMO spam; transparency on AI limits.

## 8. Objections
- “Yanlış cevap verir mi?” → şeffaflık + şık doğrulama (proxy math stronger than Vertex today).
- “Ücretli mi?” → 5/gün free; Premium unlimited (fair-use).
- “Çocuk verisi?” → KVKK + guardian flow incomplete (P0 legal).

## 9. Channels (launch)
- Owned: in-app, future email/support URL.
- Rented: Google Play (primary), App Store (optional), Instagram/TikTok exam tips later.
- ASO: TR keywords — soru çöz, LGS, YKS/TYT, KPSS, ehliyet, trafik.
