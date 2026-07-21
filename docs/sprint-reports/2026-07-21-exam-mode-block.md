# Sprint Agent Raporu — 2026-07-21 exam mode block + home switch

**Koordinatör:** Auto  
**İstek:** Yanlış sınav modunda çözüm gösterme (premium ekran); ana sayfa mod değişimi takılması  
**Ekipler:** mobile, design, guardian  
**Skill:** `cozbil-expo-mobile`, `cozbil-guardian`  

## Yapılanlar

1. **Sınav uyumsuzluğu — hard block**
   - `resolveExamModeBlock` — KPSS + Ehliyet, tüm cross-exam (topic/subject/hint)
   - `ExamModeBlockScreen` — premium navy/orange tam ekran; çözüm adımları yok
   - Tek solve + çoklu batch: mismatch → block ekranı
   - Eski “profilde kalsın” seçeneği kaldırıldı

2. **Ana sayfa mod değişimi**
   - `ExamModeSwitcher` ana sayfaya taşındı (Ayarlar’a gitmeden)
   - Optimistic switch: `examPreferenceCache` + `useExamModeChange`
   - Focus’ta tam ekran spinner yalnızca ilk yüklemede; gereksiz `callUpdateExamType` kaldırıldı

## QA Gate

- mobile `typecheck` PASS
- `examModeGuard`, `ExamModeBlockScreen`, `home.smoke` PASS
- guardian: eğitim dili nötr, sınav kapsamı LGS+YGS+KPSS+Ehliyet

**Sonraki:** Telefonda KPSS mod + Ehliyet fotoğrafı → block ekranı; mod değiştir → akıcı geçiş
