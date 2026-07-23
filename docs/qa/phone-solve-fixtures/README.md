# Phone solve fixtures — 4 sınav (şıklar dahil)

Telefon dogfood / pipeline smoke için **özgün** çoktan seçmeli sorular + kitapçık tarzı görseller.

> Telif: ÖSYM/MEB kitapçığı metni **yok**. Geçmiş sınav **tarzı / ölçeği**; `source: original`, `license: owned`.  
> Kurallar: `docs/architecture/item-bank.md`

## Paket

| Sınav | Dosya | Görsel | Cevap |
|-------|--------|--------|-------|
| **LGS** | `lgs-math-kesir-dogfood-001.json` | `images/lgs-math-kesir-dogfood-001.png` | **B) 3** |
| **YGS** | `ygs-math-denklem-dogfood-001.json` | `images/ygs-math-denklem-dogfood-001.png` | **E) 9** |
| **KPSS** | `kpss-math-yuzde-dogfood-001.json` | `images/kpss-math-yuzde-dogfood-001.png` | **A) 90** |
| **Ehliyet** | `trafik-traffic-hiz-dogfood-001.json` | `images/trafik-traffic-hiz-dogfood-001.png` | **B) 50** |

## Nasıl kullanılır?

1. Telefonda ilgili sınav **modunu** seç (LGS / YGS / KPSS / Ehliyet).  
2. Galeriden ilgili PNG’yi yükle **veya** ekranı fotoğrafla.  
3. DOĞRU CEVAP bandında tablodaki şık beklenir.  
4. Yanlış modda (örn. KPSS + Ehliyet görseli) → sınav uyumsuzluğu ekranı.

## Soru özetleri

### LGS — Kesirler
24 öğrenci; 3/8’i kız; kızların 1/3’ü kulüp → `24×3/8×1/3 = 3` → **B**

### YGS — Denklem
`3(x−2)+4 = 2x+7` → `x = 9` → **E**

### KPSS — Yüzde
100 → %20↑ = 120 → %25↓ = 90 → **A**

### Ehliyet — Trafik
Yerleşim yeri içi azami hız (aksi işaret yok) → **50 km/s** → **B**

## Konum

```
docs/qa/phone-solve-fixtures/
  README.md
  *.json
  images/*.png
```

Item-bank kopyaları (şema uyumlu, görsel alanı yok): `content/item-bank/{lgs,ygs,kpss,trafik}/…`
