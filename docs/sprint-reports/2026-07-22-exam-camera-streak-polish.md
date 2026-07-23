# Sprint report — 2026-07-22 (dogfood UI + camera OCR)

## Özet

Ana sayfa / ayarlar sınav modu takılması, kamera OCR, streak→istatistik navigasyonu,
ayarlar/profil polish ve çözüm loading mark’ı düzeltildi.

## Değişiklikler

1. **Exam mode:** Ücretsiz kullanıcıda reklam alert’i kaldırıldı; paket IA olarak anında
   değişir (`useExamModeChange` + settings aynı hook).
2. **Kamera OCR:** `base64: true` + proxy `/solve-image` binary path; URI fetch’e bağımlılık yok.
3. **Streak:** Ana sayfa seri satırı / chip → İstatistik sekmesi; stats’ta streak ring + hafta.
4. **Ayarlar / Profil:** `Button` / `PressableSurface`, gölgeli kartlar, reklam-geçiş copy temizliği.
5. **Analyzing:** Dairesel mark, orbit noktaları kaldırıldı, yumuşak pulse.

## QA Gate

- typecheck: PASS
- lint: N/A (Phase 1 echo)
- smoke/jest (ilgili suite): PASS
- guardian: PASS (exam scope LGS+YGS+KPSS+Ehliyet; abartılı çözüm iddiası yok)

## Sprint Agent Raporu

**Koordinatör:** Auto (ÇözBil)
**Kullanılan ekipler:** mobile, design, qa, guardian
**Kullanılan skill/agent setleri:**
- cozbil-team-skills
- cozbil-expo-mobile
- cozbil-guardian
**Skill bypass:** hayır (ui-ux-pro-max / Context7 bu turda derin API araması yok — mevcut Expo ImagePicker API)
**QA Gate:** typecheck PASS / lint N/A / smoke PASS / errors temiz / guardian PASS
**Sonraki önerilen adım:** Telefonda kamera → çöz dogfood doğrula; Cloudflare Metro `:443` ile bağlan.
