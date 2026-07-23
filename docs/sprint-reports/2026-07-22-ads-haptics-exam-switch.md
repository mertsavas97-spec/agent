# Sprint report — 2026-07-22 · Ads gates + exam switch + home CTAs

## Özet

Sınav paketi değişiminde aralıklı “basmıyor” hissi giderildi; ana sayfa Galeri / Çoklu çöz CTA’ları `Button` oldu; free reklam kapıları (çoklu = her açılışta 1 rewarded, çözüm çıkışında interstitial) doğrulandı ve testlerle kilitlendi.

## Sprint Agent Raporu

**Koordinatör:** Auto (Koordinatör)
**Kullanılan ekipler:** mobile, design (CTA polish), qa, guardian
**Kullanılan skill/agent setleri:**
- `cozbil-team-skills` (route)
- `cozbil-expo-mobile`
- `cozbil-guardian` (copy: abartısız reklam metni)
- executor rolü (implement)
- ship-gate / typecheck + jest

**Çalıştırılan lane'ler:**
- Exam mode switch reliability (`useExamModeChange`)
- Home CTA buttonization + haptics
- Free ads policy: multi rewarded + leave interstitial

**Skill bypass:** Context7 (mevcut Button / PressableSurface API’si yeterli)

**QA Gate:**
- typecheck: PASS
- lint: N/A (eslint henüz yok)
- smoke: PASS (`home.smoke`, policy/hook unit)
- errors: temiz
- guardian: PASS (reklam copy abartısız; exam scope drift yok)

**Sonraki önerilen adım:** Cihazda dogfood — Ayarlar sınav sekmeleri + free çoklu reklam stub Alert + çözüm bitince interstitial Alert.
