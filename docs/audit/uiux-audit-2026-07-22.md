# ÇözBil — FAZ 1 UI/UX Audit

**Tarih:** 2026-07-22  
**Branch:** `cursor/solve-word-eq-proxy-6767` @ `2adbb83`  
**Kapsam:** Moodboard piksel + Spec Kit + canlı UI (kod değişikliği yok)  
**Önceki yarım run:** GPT 5.6 Sol (`bc-019f8273…`) — SSoT blokerlerinde durdu; bu branch’te blokerler çözülüp audit tamamlandı  
**Çıktı formatı:** `Ekran | Bulgu | Öncelik | Moodboard/Spec Referansı | Önerilen Çözüm`

**Öncelik tanımı**

| Seviye | Anlam |
|--------|--------|
| **P0** | Kullanıcı akışını bozan veya marka/SSoT tutarsızlığı yaratan |
| **P1** | Polish / IA / tutarlılık (akış çalışır) |
| **P2** | Nice-to-have |

**Kapsam dışı (öneri üretilmedi):** veli hesabı / haftalık rapor (v1.1); geometri diyagram / AI pratik / spaced repetition (v1.2); iOS-özel tasarım.

---

## Bölüm 0 — SSoT durumu (Sol blokerleri)

| Kaynak | Bu branch’te durum | Audit kararı |
|--------|-------------------|--------------|
| `docs/design/moodboard/cozbil-mvp-moodboard.png` | **Var** | Piksel audit yapılabilir |
| `docs/design/moodboard/README.md` | Hâlâ **3 sınav** listeler | Moodboard görsel = 3; ürün SSoT = 4 → drift olarak raporlanır |
| Fiyat | `pricing-policy.md` + `pricing.ts` + `spec.md` = **320 TL/yıl** | Canonical **320**. Stale **279** yalnız `specs/001-…/checklists/requirements.md` validation notunda |
| Sınav kapsamı | Constitution / brief / `002` spec = **LGS · YGS · KPSS · Ehliyet** | Canonical **4 sınav**. Moodboard çerçevesi 3 gösterir → UI–moodboard drift |
| `data-model.md` | Bu branch’te `trafik` / Ehliyet ile hizalı olmalı; residual drift varsa P1 doc | Runtime UI zaten 4 sınav |

**Guardian notu:** `.agents/skills/cozbil-guardian/SKILL.md` hâlâ “LGS+YGS+KPSS” der; ürün kilidi bu branch’te 4 sınava güncellendi. Skill metni FAZ 2 doc sync adayı (bu audit’te kod/skill değiştirilmedi).

---

## Özet verdict

| Alan | Durum |
|------|--------|
| Token / tipografi (navy · orange · Poppins) | **Uyumlu** |
| Çözüm çekirdek döngüsü (çek → analiz → adım adım) | **Uyumlu** (loading + solution güçlü) |
| Moodboard IA (4 tab, kamera ekranı, kitap+ampul ikon, 3 sınav) | **Kısmi drift** |
| Ürün SSoT (4 sınav, 320 TL) vs moodboard çerçevesi | **Bilinçli ürün genişlemesi; moodboard güncellenmeli** |
| Store / ads honesty | Stub reklamlar dürüst; AdMob yok (store P0 — ayrı launch audit) |

**FAZ 2’ye geçiş:** Owner onayı gerekir. Aşağıdaki P0’lar önce netleştirilmeli (özellikle moodboard 3↔4 sınav ve ikon markası).

---

## Denetim tablosu

| Ekran | Bulgu | Öncelik | Moodboard / Spec referansı | Önerilen çözüm |
|-------|--------|---------|----------------------------|----------------|
| **App icon / brand mark** | Moodboard: navy kare + açık kitap + turuncu ampul. Uygulama: robot mark (`CozbilRobot` / brand pack). Splash/adaptive navy OK; marka silüeti farklı. | **P0** | Moodboard logo paneli; `docs/design/moodboard/README` §App icon | Owner kararı: (A) store/UI’yi moodboard kitap+ampul’e çek **veya** (B) moodboard’u robot mark ile güncelle. Tek SSoT seç. |
| **Splash / slogan** | Moodboard slogan: “Yapay Zeka ile soruların çözüm ortağı”. Cold start’ta bu slogan hero olarak yok / zayıf. | **P1** | Moodboard identity panel | Splash veya onboarding-1’e kısa slogan satırı (abartısız, guardian-uyumlu). |
| **Onboarding 1** | Başlık `Fotoğrafla çöz` moodboard ile uyumlu. Moodboard’daki öğrenci+geometri hero görseli yok; feature list + ikon var. | **P1** | Moodboard onboarding-1; FR-013 | Opsiyonel full-bleed eğitim atmosfer görseli; kart yığını ekleme. |
| **Onboarding 2** | `Adım adım anlatır` uyumlu. 3D öğrenci karakteri yok. | **P2** | Moodboard onboarding-2 | İllüstrasyon veya sade diyagram; zorunlu değil. |
| **Onboarding 3 — sınav** | UI: **LGS / YGS / KPSS / Ehliyet**. Moodboard çerçevesi yalnız **3**. Spec FR-013 / SC-003 / SC-006 = 4 zorunlu. | **P0** | Moodboard exam list vs `spec.md` FR-013 | Moodboard + README’yi 4 sınava güncelle (ürün kilidi). UI’dan Ehliyet çıkarma **spec ihlali** olur. |
| **Onboarding 3 — CTA** | Moodboard “Devam Et”; app yaş/KVKK sonrası `Ana sayfaya git`. Akış doğru, etiket drift. | **P2** | Moodboard CTA | İstenirse son adımda “Devam Et” / “Başla” hizası. |
| **Onboarding — a11y** | Consent / yaş bantları önceki audit’te düzeltildi; WCAG turuncu/beyaz kontrastı hâlâ ölçülmeli. | **P1** | Moodboard style guide; önceki D03/D04 | Kontrast spot-check (turuncu CTA üzerinde beyaz metin). |
| **Ana Sayfa — hero CTA** | Büyük turuncu `Soru fotoğrafı çek` + streak chip var; token uyumlu. | — | Moodboard home CTA | Uyumlu — aksiyon yok. |
| **Ana Sayfa — selamlama** | Moodboard: `Merhaba, Ali!` + bildirim zili. App: marka `ÇözBil` + sınav switcher; kişiselleştirilmiş selamlama/zil yok. | **P1** | Moodboard home header | Hafif “Merhaba” + (opsiyonel) bildirim entry; zili push hazır değilse gösterme. |
| **Ana Sayfa — streak UI** | Chip `{n} gün` var; moodboard’daki 7 günlük yatay seri bar yok. | **P1** | Moodboard streak strip | Haftalık seri şeridi (P1 polish). |
| **Ana Sayfa — yoğunluk** | Multi-batch, konular linki, son çözülenler, exam switcher, stub banner — moodboard tek-kompozisyon hero’sunu kalabalıklaştırıyor. | **P1** | Moodboard home (tek CTA odağı); frontend design rules | CTA’yı hero’da yalnız bırak; multi/konu/recent’i fold altına. |
| **Ana Sayfa — reklam stub** | `Reklam alanı · yakında` dürüst stub. Store için AdMob yok. | **P1*** | `ads-policy.md`; launch audit | *Ürün UI P1; store launch P0 (ayrı gate). |
| **Tab bar** | Moodboard **4** tab: Ana Sayfa / Geçmiş / İstatistik / Profil. App **5**: + **Konular**. | **P0** | Moodboard nav; topics feature shipped | (A) Moodboard’a 5. tab ekle **veya** (B) Konular’ı Ana Sayfa/Profil altina taşıyıp 4 tab’a dön. Owner IA kararı. |
| **Kamera** | Moodboard: in-app kamera (crop köşeleri, flaş, galeri). App: OS `ImagePicker` → `capture-confirm`. | **P0** | Moodboard camera screen | Custom kamera ekranı (crop guide) veya moodboard’u “sistem kamerası + onay” olarak revize et. |
| **Fotoğraf onay** | `Fotoğrafı kontrol et` / `Evet, çöz` — moodboard’da yok ama güvenli ara adım. | **P2** | Spec solve flow | Tut; moodboard’a opsiyonel ekle. |
| **Analiz / loading** | Navy zemin, robot, **“Sorun analiz ediliyor…”**, progress — moodboard ile güçlü uyum. | — | Moodboard analyzing | Uyumlu. |
| **Çözüm — sekmeler** | `Adım adım` + `Kısa çözüm` moodboard’da var; app’te ek **Konu anlatımı** sekmesi. | **P1** | Moodboard solution tabs | 3. sekme değerli; moodboard’a ekle veya “daha fazla” altına al. |
| **Çözüm — cevap hero** | `DOĞRU CEVAP` / yapılandırılmış cevap — net. Transparency notu var. | — | Spec solution UI | Uyumlu (dürüstlük iyi). |
| **Çözüm — assisted** | `Tam otomatik cevap yok` banner — doğru honesty. | — | Comprehensive audit H01 | Uyumlu. |
| **Çözüm — Anlamadım** | `Anlamadım, tekrar açıkla` mevcut (US2). | — | Spec US2 | Uyumlu. |
| **Geçmiş** | Liste + ders/konu filtre + exam chip. Moodboard’da detay az; işlevsel. | **P2** | Moodboard history tab | Kart stili / boş durum illüstrasyonu polish. |
| **İstatistik** | Ders/konu bar’ları + streak ring var. Moodboard “Detaylı Rapor” dropdown yok. | **P1** | Moodboard stats | “Detaylı rapor” v1.1’e erteli (veli/rapor OUT); UI’da vaat etme. Bar görsellerini moodboard oranına yaklaştır. |
| **Profil** | Premium CTA, sınav, kota, çıkış, veri silme. Moodboard profil paneli seyrek. | **P1** | Moodboard profile tab | Sadeleştir; ayarları Settings’e yığ. |
| **Ayarlar** | Sınav paketi, push prefs (delivery yok), legal. Push “çalışıyor” izlenimi riski. | **P0** | Settings honesty (önceki audit) | Push kapalıysa “yakında / cihaz kaydı yok” net kalsın; sahte delivery yok. |
| **Paywall** | `Hemen Başla` / yıllık CTA; fiyat **14,90 / 39 / 320**; `%32`. Moodboard “7 gün ücretsiz deneme” disclaimer’ı app’te yok (haftalık ücretli giriş var). | **P1** | Moodboard premium; `pricing-policy.md` | Moodboard’daki “ücretsiz deneme”yi kaldır veya gerçek trial SKU ekle — **yanıltıcı trial copy yazma**. |
| **Paywall — sosyal ispat** | `LGS · YGS · KPSS · Ehliyet` — SSoT ile uyumlu; moodboard 3 sınav. | **P1** | SC-006 | Moodboard güncellenene kadar UI doğru; moodboard sync. |
| **Sınav değiştirme** | Home/Settings switcher + cross-exam block ekranı. Moodboard’da yok; ürün gereği. | **P2** | Exam-mode-block sprint | Moodboard’a “mod değiştir” notu ekle. |
| **Konular / örnek** | Moodboard envanterinde yok; item-bank / konu anlatımı için 5. tab. | **P1** | `item-bank.md`; tab P0 ile bağlı | IA kararına bağla (tab P0). |
| **Doc drift — 279** | Checklist validation notu hâlâ **279 TL** diyor; canonical **320**. | **P1** | `specs/001/…/requirements.md` vs pricing-policy | Checklist satırını 320’ye düzelt (doc-only FAZ 2). |
| **Doc drift — moodboard README** | README 3 sınav; ürün 4. | **P0** | moodboard README vs constitution | README + PNG’yi 4 sınava hizala (FAZ 2 design). |

---

## Ekran bazlı uyum skoru (özet)

| Ekran | Moodboard | Spec / SSoT | Not |
|-------|-----------|-------------|-----|
| Token sistemi | ✅ | ✅ | `#1E1B4B` / `#F59E0B` / Poppins |
| Onboarding 1–2 | ✅ metin / ⚠️ görsel | ✅ | |
| Onboarding 3 | ❌ 3 vs 4 sınav | ✅ 4 sınav | Ürün doğru; moodboard eski |
| Home | ⚠️ kalabalık | ✅ | CTA+streak temelde var |
| Kamera | ❌ OS picker | ⚠️ | En büyük görsel boşluk |
| Analiz | ✅ | ✅ | |
| Çözüm | ✅ (+ ekstra tab) | ✅ | |
| Stats | ✅ bar’lar | ✅ | |
| Paywall | ⚠️ trial copy | ✅ 320 | |
| Tabs | ❌ 5 vs 4 | ⚠️ Konular shipped | Owner IA |

---

## P0 kısa liste (FAZ 2 öncesi karar)

1. **İkon markası:** kitap+ampul (moodboard) vs robot (shipped) — tek SSoT.  
2. **Sınav sayısı görseli:** moodboard/README → 4 sınav (ürün kilidi korunur).  
3. **Tab IA:** 4 mü 5 mi — moodboard veya app hizalanacak.  
4. **Kamera:** custom capture vs moodboard revizyonu.  
5. **Push honesty:** delivery yokken abartılı “bildirim çalışır” yok.

---

## P1 kısa liste

- Home declutter + haftalık streak şeridi + opsiyonel selamlama  
- Onboarding hero görselleri  
- Solution 3. sekme moodboard sync  
- Paywall “ücretsiz deneme” moodboard metnini kaldır  
- Checklist 279 → 320 doc fix  
- Guardian skill metnini 4 sınava güncelle  

---

## P2 kısa liste

- Onboarding CTA etiketi  
- Geçmiş boş/illüstrasyon polish  
- Capture-confirm’i moodboard’a ekle  
- Exam switcher moodboard notu  

---

## Kanıt / kaynaklar

- Moodboard: `docs/design/moodboard/cozbil-mvp-moodboard.png` + `README.md`  
- Spec: `specs/002-cozbil-mvp/spec.md` (FR-013, SC-003/006, pricing)  
- Tokens: `apps/mobile/src/theme/tokens.ts`  
- Pricing: `docs/product/pricing-policy.md`, `apps/mobile/src/features/paywall/pricing.ts`  
- Nav: `apps/mobile/app/(tabs)/_layout.tsx`  
- Önceki auditler: `docs/audits/mvp-1.0-comprehensive-audit-2026-07-21.md`, `docs/audits/mvp-1.0-launch-ready-audit-2026-07-20.md`  
- Sol yarım run: https://cursor.com/agents/bc-019f8273-a782-7fd9-abf3-444b0add6767  

---

## FAZ 2 durumu (2026-07-22)

Owner “devam” → FAZ 2 uygulandı. Kararlar: `docs/audit/faz2-decisions-2026-07-22.md`.

| P0 | Durum |
|----|--------|
| İkon robot SSoT + moodboard README | Done (PNG sonraki design pass) |
| 4 sınav moodboard README | Done |
| 5 tab moodboard README | Done |
| Kamera = sistem + crop-guide onay | Done (custom kamera ertelendi) |
| Push honesty | Done |

P1: home declutter / streak week / Merhaba; paywall trial copy; checklist 320; guardian skills.  
PNG piksel refresh ve full custom camera: backlog.
