# UI polish — konu anlatımı + loading — 2026-07-19

## Kullanılan setler
- spec-kit: `specs/002-cozbil-mvp/` T069 / T067 kısmi
- designer: moodboard + `ui-design-system` token kuralları (app UI’de taste yok)
- executor: TDD (AnalyzingView, SolutionScreen, topicLessons, topics smoke)

## Yapılanlar
- **Konu anlatımı sekmesi**: demo chip grid → tıklanabilir konular, `/topic/[id]` öğretmen anlatımı, ders filtreli örnekler, 10 özgün madde
- **Çözüm ekranı**: Adım adım / Kısa çözüm / **Konu anlatımı** üç sekme
- **Loading**: neşeli `CozbilRobot` (anten + gülümseme + yanak), moodboard wording (“Lütfen birkaç saniye bekle”)
- Stub çözüm adımları zenginleştirildi

## Kalan
- T067 tam ~50–60 madde
- T062 app icon asset yenileme
- T063 dogfood raporu · T070 guardian pass
- Live Vertex env Mac’te
