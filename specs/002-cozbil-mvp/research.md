# Research: ÇözBil MVP 1.0

**Date**: 2026-07-18  
**Feature**: `specs/002-cozbil-mvp`

## Decisions

### D1 — Client: Expo (React Native), Android-first

- **Decision**: Expo managed workflow ile başla; kamera için MVP’de
  `expo-image-picker` (kamera + galeri). `react-native-vision-camera`
  yalnızca picker yetersiz kalırsa.
- **Rationale**: Hızlı iskelet, OTA, Google Startup döneminde iterasyon.
- **Alternatives**: Bare RN, Flutter — ek öğrenme/kurulum maliyeti.
- **Verify before code**: Context7 / Expo docs (SDK sürümü, picker
  permissions Android).

### D2 — Backend: Firebase Auth + Firestore + Cloud Functions + Storage

- **Decision**: Tüm AI/moderasyon/kota sunucu tarafında (Functions);
  istemci yalnızca Storage’a yükler ve callable/HTTPS endpoint çağırır.
- **Rationale**: API anahtarlarını client’ta tutmama; rate limit merkezi;
  MVP maliyeti düşük.
- **Alternatives**: Custom Nest/FastAPI — erken ops yükü.
- **Verify**: Context7 Firebase Admin / callable functions patterns.

### D3 — Vision solve: Gemini Vision + ders-özel sistem prompt

- **Decision**: Matematik (P1) ve Türkçe (P2) için ayrı sistem prompt
  şablonları; çıktı yapılandırılmış adımlar (JSON şema veya sıkı
  markdown bölümleri). Konu sınıflandırma aynı çağrıda veya ucuz ikinci
  çağrı — maliyet/kalite trade-off implementasyon spike’ında ölçülür;
  varsayılan: tek çağrıda çözüm + `topicId`.
- **Rationale**: Owner brief; kredi AI denemesine izin veriyor.
- **Alternatives**: Yalnız OCR + ayrı LLM — ekstra gecikme.
- **Verify**: Context7 / Google AI Gemini multimodal docs; SafeSearch
  ayrı Cloud Vision API.

### D4 — Moderasyon önce, sonra Gemini

- **Decision**: Pipeline sırası: upload → SafeSearch → (reject) OR
  dedup → Gemini → persist → quota decrement only on successful solve
  or billable follow-up.
- **Rationale**: Çocuk güvenliği + maliyet.
- **Neutral copy**: Brief’teki mesaj zorunlu.

### D5 — Dedup: perceptual hash (pHash) first

- **Decision**: MVP’de görsel pHash + Hamming distance eşiği; embedding
  benzerliği 1.1+ isteğe bağlı.
- **Rationale**: Ucuz, Functions içinde çalıştırılabilir; “aynı fotoğraf
  tekrar” senaryosunu karşılar.
- **Alternatives**: Yalnız Gemini her seferinde — pahalı/yavaş.

### D6 — Kota ve abonelik

- **Decision**: Ücretsiz 5 soru/gün (UTC+3 gün sınırı); tek aylık plan
  vitrin 49 TL; Play Billing entegrasyonu paywall story’sinde.
  Follow-up “anlamadım” ücretsiz hakkından düşmez (öğrenme vaadi); abuse
  için follow-up ayrı rate limit.
- **Rationale**: Brief bandı 3–5 ve 39–59; net varsayılanlar spec’te.

### D7 — UI yönü (designer + ui-ux-pro-max)

- **Decision**: Brief paleti bağlayıcı — ana `#1E1B4B`–`#312E81`, vurgu
  `#F59E0B`–`#FBBF24`, zemin `#F8FAFC`; Manrope/Poppins tarzı yuvarlak
  sans; kart tabanlı uygulama UI (landing kuralları değil). Tab bar 4’lü.
- **Note**: Bu ortamda ui-ux-pro-max skill kurulu değilse designer
  pass’inde CLI/skill kurulumu tasks’a dahil; moodboard PNG henüz yok —
  brief metni yeterli başlangıç.
- **Do not use** taste-skill / transitions.dev on in-app screens.

### D8 — Konu kataloğu

- **Decision**: Statik JSON/TS modülü `apps/mobile/src/data/lgs-topics.ts`
  (+ functions mirror veya tek paylaşılan kopya). Matematik LGS konuları
  önce; Türkçe ikinci dalga.
- **Rationale**: MEB listesi yavaş değişir; MVP’de CMS gerekmez.

### D9 — Gizlilik / KVKK akış iskeleti

- **Decision**: Onboarding’de yaş bandı + veli onayı checkbox/akışı;
  veri silme talebi Profil’de; hukuki metin placeholder + TODO(legal).
- **Rationale**: Constitution/operating + brief; agent hukukçu değil.

### D10 — Test stratejisi

- **Decision**: Functions için saf birim testleri (moderation branching,
  quota, topic tagging mocks); mobil için component testleri; sözleşmeler
  `contracts/` altındaki şemalara göre.
- **Rationale**: Constitution III.

## NEEDS CLARIFICATION resolution

Technical Context’teki tüm bilinmeyenler owner brief + yukarıdaki
varsayımlarla kapatıldı. Kalan dış bağımlılıklar (marka müsaitliği,
hukuk metni, Play Console hesabı) implementasyonu bloklamayan TODO’lar.

## Open owner TODOs (non-blocking for scaffold)

1. Final marka + Play/domain check
2. Moodboard görsel asset’i designer’a
3. KVKK danışman metinleri
4. Gemini / GCP proje + Startup kredisi bağlama
