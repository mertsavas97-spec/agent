# [ÇözBil] — MVP 1.0 Ürün Spesifikasyonu

> Spec Kit: `specs/001-product-definition/` + `specs/002-cozbil-mvp/`  
> Moodboard: `docs/design/moodboard/`  
> Çakışmada constitution + Spec Kit `spec.md` baskındır.

---

## 1. Proje Özeti

Türkiye'deki sınav adaylarına yönelik, fotoğrafla soru çözüp adım adım Türkçe açıklama sunan AI destekli eğitim uygulaması.

**Sınav kapsamı (MVP):** **LGS · YGS · KPSS** (üçü de aktif seçilebilir).  
**Platform:** Android öncelikli (React Native / Expo).  
**Kaynak:** Google Startup Kredisi (AI dahil).  
**Çalışma adı:** ÇözBil (final mağaza/alan adı TBD).

---

## 2. Problem & Fırsat

- Öğrenciler/adaylar soruya takıldığında hızlı, adım adım Türkçe çözüm bulamıyor.
- Global AI araçları Türk müfredatı / sınav formatına özel değil.
- Farklılaşma: sınav-aware kalite, şeffaflık, ileride veli raporu (1.1), dar ama çoklu sınav odağı.

---

## 3. Rakip Analizi

Önceki brief ile aynı tablo (Kunduz, Shifu, Taktik, Koç’a Sor, DigiKamp, vb.).  
Konum “yalnız genel soru çözücü” değil; **LGS + YGS + KPSS** track’leri ve öğrenci ilerleme verisi.

---

## 4. Hedef Kitle & Konumlandırma

- **LGS:** ~13–15 yaş (veli sıkça öder)
- **YGS:** lise / üniversite öncesi aday (owner etiketi; YKS ailesi)
- **KPSS:** yetişkin kamu personeli adayı
- **Konumlandırma:** “Türkiye’nin sınav odaklı AI çalışma arkadaşı — LGS, YGS, KPSS; çözer, anlatır, eksiğini gösterir.”

---

## 5–7. Marka, stack, pipeline

Önceki brief ile aynı teknik yön (Expo, Firebase, Gemini Vision, SafeSearch).  
Prompt ve konu kataloğu **examType**’a göre seçilir.

---

## 8. MVP 1.0 Kapsamı

### Dahil

- Fotoğrafla soru çözme (matematik öncelik; Türkçe ikinci)
- LGS / YGS / KPSS onboarding seçimi (hepsi aktif)
- Adım adım çözüm + “anlamadım”
- Geçmiş, istatistik/zayıflık, streak
- Paywall, moderasyon, rate limit
- Moodboard UI (navy/orange, Poppins, robot loading)

### Hariç (1.1 / 1.2)

- Veli hesabı/rapor, rozetler, pratik session, diyagram render, spaced repetition

---

## 9–16. Yol haritası, güvenlik, monetizasyon, riskler

Önceki brief ile uyumlu. Freemium varsayılan: **5**/gün; Premium:
**14,90 TL**/7 gün, **39 TL**/ay, **349 TL**/yıl (`docs/product/pricing-policy.md`).  
KVKK: yaş bandına göre (LGS minor vs yetişkin KPSS/YGS).

---

## 17. Sonraki Adımlar

- [ ] Marka / mağaza müsaitliği
- [x] Moodboard projede (`docs/design/moodboard/`)
- [ ] YGS/KPSS konu listesi uzman doğrulaması
- [ ] Prompt şablonları (sınav × ders)
- [ ] Firebase + Gemini iskelet (`tasks.md`)
- [ ] KVKK hukuki metin
