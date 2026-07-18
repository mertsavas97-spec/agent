# Proje Bağlamı (otomatik üretildi — setup-cursor-ajans.sh)

**Ürün kilidi (2026-07-18):** Bu bir **eğitim uygulaması** (oyun değil).
Çalışma adı **ÇözBil** — **LGS, YGS, KPSS** adaylarına fotoğrafla adım adım
Türkçe soru çözümü. Moodboard: `docs/design/moodboard/`. Detay:
`specs/001-product-definition/` + `specs/002-cozbil-mvp/`.
Uygulama kodu yalnızca Spec Kit tasks üzerinden başlar.

## Zorunlu akış
1. Her görev önce `.specify/` altındaki spec/plan/tasks durumuna bakar.
2. Spec yoksa önce spec-kit adımları (constitution → specify → clarify →
   plan → tasks) çalıştırılır.
3. Kod yazımı superpowers'ın test-driven-development ve
   subagent-driven-development skill'leriyle yürütülür.
4. Her kütüphane/API kararı context7 üzerinden doğrulanır, hafızadan
   API üretilmez.
5. Tasarım kararları ui-ux-pro-max-skill üzerinden alınır
   (React Native / SwiftUI / Flutter stack desteği var).
6. taste-skill ve transitions.dev SADECE pazarlama sitesi / landing page
   içindir, uygulamanın kendisinde kullanılmaz.
7. Büyüme/ASO/pazarlama metinleri marketingskills ile üretilir.
8. İş/yönetim/finans konuları alirezarezvani bundle'ları ile ele alınır.

## Koordinatör
Tüm görev dağıtımı ve raporlama `.cursor/rules/000-coordinator.mdc`
dosyasındaki kurallara göre yürütülür. Detaylar için o dosyaya bakın.

## Aktif özellik
- `specs/001-product-definition/` — ürün tipi / persona / yüzey (**Locked**)
- `specs/002-cozbil-mvp/` — MVP 1.0 (spec + plan + tasks hazır)
- Owner brief arşivi: `docs/product/cozbil-mvp-1.0-brief.md`

## Sprint raporları
`docs/sprint-reports/` klasöründe tarih damgalı olarak tutulur.
Bu dosyalar aynı zamanda projenin "hafızası" görevi görür (claude-mem'in
Cursor'da resmi desteği olmadığı için manuel hafıza yerine geçer).
