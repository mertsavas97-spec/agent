# Premium UI polish brief — Ana Sayfa / Geçmiş

**Roller:** designer (`roles/designer.mdc`) + executor  
**Skills:** `cozbil-expo-mobile`, `ui-design-system` (token scale), moodboard (`docs/design/moodboard/`)  
**Kullanılmadı:** taste-skill / transitions.dev (yalnızca marketing site)

## Sorun
- Ana sayfadaki LGS/YGS/KPSS çıplak chip; “sınav seçici” olduğu anlaşılmıyor
- Hiyerarşi düz; moodboard’daki soft surface + güçlü turuncu CTA yok
- Geçmiş filtreleri ve boş durumlar debug hissi veriyor

## Kararlar
1. **ExamModeSwitcher** → etiketli segmented control (“Sınavın”) + kısa alt açıklama (Lise / Üniversite / Kamu)
2. Ortak **SegmentedTabs** molekülü (home sınav + history ders filtre)
3. Home: streak chip, gölgeli kamera CTA, teknik “pipeline” hint kaldır
4. History/Stats: tutarlı boş durum + soft yüzey; reklam slotu nötr (mor değil)
5. Token: `orangeSoft`, `navySoft`, `shadow` — marka HEX sabit

## Kabul
- Seçili sınav görsel olarak net (navy dolgu + turuncu vurgu)
- “Sınavın” / açıklama metni görünür
- Mevcut testID’ler korunur (`exam-mode-*`, `capture-cta`, `history-screen`)
