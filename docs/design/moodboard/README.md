# ÇözBil MVP Moodboard

**Asset:** [cozbil-mvp-moodboard.png](./cozbil-mvp-moodboard.png)

Owner’ın ilettiği MVP moodboard referansı (navy + turuncu, Poppins).  
UI implementasyonunda bağlayıcı **token / akış** kaynağıdır; ürün UI’sinde
taste-skill / transitions.dev kullanılmaz.

> **2026-07-22 FAZ 2 sync:** PNG çerçevesi tarihsel olarak 3 sınav / 4 tab /
> kitap+ampul ikon gösterir. **Canonical ürün kilidi** aşağıdadır — runtime ve
> spec buna uyar; PNG bir sonraki design pass’te yenilenecek.

## Sınav kapsamı (ürün kilidi)

Onboarding’de **dört seçenek de aktif**:

| Kod | Etiket | Anlam |
|-----|--------|--------|
| `lgs` | LGS | Lise giriş |
| `ygs` | YGS | Yükseköğretime geçiş (owner etiketi; YKS ile aynı aile) |
| `kpss` | KPSS | Kamu personeli seçme |
| `trafik` | Ehliyet | Sürücü adayı (trafik / araç / ilk yardım) |

> Not: Moodboard/metinlerde “YGS” kullanılır. Resmi güncel ad “YKS” olsa da
> ürün MVP’sinde owner kararıyla **YGS** etiketi geçerlidir.

## Marka işareti

Canonical UI/store mark: **navy zemin + beyaz robot** (`apps/mobile` brand pack /
`CozbilRobot`). PNG’deki kitap+ampul tarihi taslak; yeni asset gelene kadar robot SSoT’tir.

## Tasarım token özeti

| Token | Değer |
|-------|--------|
| Primary navy | `#1E1B4B` |
| Accent orange | `#F59E0B` |
| Surface | `#FFFFFF` / açık gri zemin |
| Font | **Poppins** (SemiBold başlık, Regular gövde) |
| Radius | ~12–16px buton/kart |
| İkon | İnce outline |

## Ekran envanteri (hedef IA)

1. App icon — navy + robot mark  
2. Onboarding 1 — fotoğrafla çöz  
3. Onboarding 2 — adım adım anlatır  
4. Onboarding 3 — sınav seçimi **LGS / YGS / KPSS / Ehliyet**  
5. Ana ekran — streak + büyük turuncu kamera CTA (ikincil: galeri; fold altı: çoklu / konular / geçmiş özeti)  
6. Kamera — **sistem kamera/galeri** → onay ekranı (crop guide)  
7. Analiz / loading — robot maskot (“Sorun analiz ediliyor…”)  
8. Çözüm — adım adım + kısa çözüm (+ konu anlatımı sekmesi)  
9. İstatistik / ilerleme — ders bar’ları  
10. Premium paywall — “Hemen Başla” (ücretli haftalık giriş; **ücretsiz deneme vaadi yok**)  

## Navigasyon

Alt tab: **Ana Sayfa / Konular / Geçmiş / İstatistik / Profil** (5 sekme).  
Konular = sınav sekmeli konu anlatımı + örnek soru (item-bank).

## Maskot

Yükleme anlarında yuvarlak, sade robot kafa — abartılı çocuksu değil, sıcak AI arkadaşı.
