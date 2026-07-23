# Sprint report — 2026-07-22 (camera OCR + streak + loading polish)

## Sprint Agent Raporu
**Koordinatör:** Auto (Composer)
**Kullanılan ekipler:** Mobile (Executor) + Design + QA + Guardian
**Kullanılan skill/agent setleri:** `cozbil-team-skills`, `cozbil-expo-mobile`, `cozbil-guardian`, moodboard
**Skill bypass:** Context7 N/A (expo-image-picker already in project; no new native module)
**QA Gate:** typecheck PASS / lint N/A / unit 37 PASS (exam matrix, streak, camera, analyzing) / tunnels CF+proxy 200 / guardian: no exam drift, no overclaim
**Sonraki önerilen adım:** Telefonda Cloudflare deep link ile reload → kamera ile net foto dene → ana sayfada bugünün streak noktası dolmalı.

## Yapılanlar

### Kamera vs galeri
- Kamera JPEG kalitesi **0.82** (galeri 0.7) — 0.55 OCR’ı ezıyordu.
- `pendingSolveImageStore`: `content://` URI router param’da bozulmasın diye bellekten taşınıyor.

### Sınav türü geçişleri
- 12 yönlü topic-prefix matrisi test edildi (LGS↔YGS↔KPSS↔Ehliyet).
- Ehliyet altında akademik ders + topic yok → yine block (math→LGS, turkish→KPSS).
- Mevcut switch → Alert → ana sayfa akışı korundu.

### Günlük seri
- Proxy/dogfood çözümünde `recordLocalSolveStreak`.
- Ana sayfa haftası artık **takvim günü** (Pzt–Paz) — “streakCount >= 7-i” hack’i kalktı.
- Bugün çözünce ilgili gün doluyor.

### Loading / UI
- AnalyzingView: köşe demo çemberleri kaldırıldı; logo halkası küçültüldü, dairesel premium plate.
- ExamModeBlockScreen: sağ üst `heroGlow` demo çemberi kaldırıldı.

## Telefon
```
exp+cozbil://expo-development-client/?url=https%3A%2F%2Frugby-started-kelkoo-turbo.trycloudflare.com%3A443
```
