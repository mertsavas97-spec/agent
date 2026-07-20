# Türkiye sınav ders ağacı — 2020 → 2026 Temmuz (ekip brifingi)

**Ekipler:** product · architect · design · mobile · backend/AI · guardian  
**Amaç:** LGS · YGS (YKS/LYS hattı) · KPSS altında **alt ders kategorileri** + katalog + AI/UI hizası  
**Telif:** ÖSYM/MEB **soru metni/PDF kopyalanmaz**. Kaynak = resmi oturum/ders yapısı + konu başlıkları (referans).

> Ürün etiketleri kilitli: `lgs` · `ygs` · `kpss`.  
> **YGS** = YKS (TYT/AYT) ailesi; eski **LYS** alan ayrımı AYT testleriyle eşlenir.

---

## 1) LGS (MEB, 2020–2026 yapı stabil)

İki oturum, **90 soru** (Sözel 50 / Sayısal 40).

| Oturum | Ders | ~Soru |
|--------|------|------:|
| Sözel | Türkçe | 20 |
| Sözel | T.C. İnkılap Tarihi ve Atatürkçülük | 10 |
| Sözel | Din Kültürü ve Ahlak Bilgisi | 10 |
| Sözel | Yabancı Dil (İngilizce) | 10 |
| Sayısal | Matematik | 20 |
| Sayısal | Fen Bilimleri | 20 |

**Ürün subject kodları:** `turkish` · `history` · `religion` · `english` · `math` · `science`

---

## 2) YGS ürün hattı = YKS (2018+; LYS yerine)

2020–2026: YKS üç oturum — **TYT** (zorunlu) · **AYT** · **YDT** (dil; MVP dışı).

### TYT (~120 soru / 165 dk)
| Test | Alt dersler | ~Soru |
|------|-------------|------:|
| Türkçe | anlam, paragraf, dil | 40 |
| Temel Matematik | sayılar… problem | 40 |
| Sosyal Bilimler | Tarih, Coğrafya, Felsefe, Din | 20 |
| Fen Bilimleri | Fizik, Kimya, Biyoloji | 20 |

### AYT (~160 soru kitapçık / puan türüne 80)
| Test | Alt dersler | ~Soru/test |
|------|-------------|------------|
| Matematik | lise mat | 40 |
| Fen | Fizik, Kimya, Biyoloji | 40 |
| TDE–Sosyal-1 | Edebiyat, Tarih-1, Coğrafya-1 | 40 |
| Sosyal-2 | Tarih-2, Coğrafya-2, Felsefe grubu, Din | 40 |

**LYS eşlemesi (tarihsel):** MF → AYT Mat+Fen; TM → Mat+TDE/Sosyal; TS → TDE+Sosyal-2.  
**Ürün subject:** `turkish` · `literature` · `math` · `physics` · `chemistry` · `biology` · `history` · `geography` · `philosophy` · `religion`

---

## 3) KPSS GY–GK (lisans / önlisans / ortaöğretim ortak çekirdek)

Tipik lisans GY–GK: **120 soru / ~130 dk**.

| Blok | Ders | ~Soru (lisans tipi) |
|------|------|--------------------:|
| Genel Yetenek | Türkçe | 30 |
| Genel Yetenek | Matematik | ~26 |
| Genel Yetenek | Geometri | ~4 |
| Genel Kültür | Tarih | 27 |
| Genel Kültür | Coğrafya | 18 |
| Genel Kültür | Vatandaşlık | 9 |
| Genel Kültür | Güncel Bilgiler | 6 |

A Grubu alan bilgisi / Eğitim Bilimleri = **MVP sonrası** (ayrı oturum).

**Ürün subject:** `turkish` · `math` · `geometry` · `history` · `geography` · `civics` · `current`

---

## 4) Ürün kararları (guardian)

1. Üç sınav etiketi değişmez (LGS+YGS+KPSS).  
2. Katalog = ders → konu; **çıkmış soru metni yok**.  
3. AI: tüm dersler için subject-aware prompt; diyagram-ağır geometri/fen → `unsupported` mümkün.  
4. Canlı kalite önceliği hâlâ Matematik + Türkçe; diğer dersler metin adımlı iskelet.  
5. “%100 ÖSYM sorusu bilir” iddiası yasak.

---

## 5) Kod eşlemesi

| Katman | Dosya |
|--------|--------|
| Subject enum + etiket | `apps/mobile/src/data/subjects.ts`, `functions/src/data/subjects.ts` |
| Konu katalogları | `*-topics.ts` (mobile + functions mirror) |
| Prompt router | `functions/src/solve/prompts.ts` → `systemPromptForSolve` |
| UI Konular | `app/(tabs)/topics.tsx` ders grupları |
| Çözüm ekranı | `SolutionScreen` sınav/ders/konu bandı |

---

## 6) Kaynak notu
Yapı özeti MEB LGS kılavuzları + ÖSYM YKS/KPSS oturum şemalarından (2020–2026).  
Soru dağılımı yıllara göre ±1 değişebilir; **ders listesi** ürün için bağlayıcıdır.
