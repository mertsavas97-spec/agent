# Fikir A — İşlemRehberi (Birincil öneri)

**Çalışma adı:** İşlemRehberi  
**Alternatif isimler:** EvrakSıram, DevletAdım, Hayatİşi, BelgeKapısı  
**Play kategorisi:** Productivity (ikincil: Tools / Lifestyle)  
**Platform:** Android-first (TR Play Store)  
**Tarih:** 2026-07-16

---

## 1. Nedir?

Türkiye’de sık yaşanan **hayat olayları** için (taşınma, evlilik, araç alım-satım, işe giriş, doğum, pasaport, emeklilik başvurusu, vergi levhası, ikametgâh vb.) kullanıcıya:

1. **Hangi belgeler lazım** (checklist)  
2. **Hangi sırayla** yapılacak (adım adım akış)  
3. **Nerede / hangi app / hangi kurum** (e-Devlet linki, randevu ipucu)  
4. **Ne kadar sürer / tipik tuzaklar**  
5. **Hatırlatma** (randevu, belge süresi)  
6. (Premium) **AI:** fotoğraftaki evrağı tanı, “bu dilekçe taslağı”, “eksik belge var mı?”

…sunan bir mobil rehber.

## 2. Nedir değildir?

| Değil | Neden |
|-------|--------|
| Avukat / hukuki tavsiye ürünü | EvrakAI, HukukChat, Nobi Law alanı; lisans + sorumluluk |
| e-Devlet klonu | Devlet API’si yok; deep link + rehber |
| TaksitDefter / bütçe app | Finans takibi yok |
| Genel ChatGPT | Tek iş: TR prosedür + checklist + hatırlatma |
| Belge üreten “sihirli imza” | Resmi işlem kullanıcıda biter; app hazırlar ve yönlendirir |

**Yasal çerçeve (MVP zorunlu):** “Bilgilendirme amaçlıdır, resmi kurum bilgisi değişebilir; hukuki danışmanlık değildir.” Kaynak: mevzuat.gov.tr / kurum sayfaları + editöryel doğrulama.

---

## 3. Neden bu? (problem)

### Jobs-to-be-done

| Tip | Job |
|-----|-----|
| Fonksiyonel | “Bu işi eksik belgesiz, doğru sırada bitirmek” |
| Duygusal | “Aptal gibi hissetmemek / kapıdan geri çevrilmemek” |
| Sosyal | “Aileme ‘ben hallettim’ diyebilmek” |

### Müşteri dili (varsayılan VOC — doğrulanacak)

- “e-Devlet’te kayboldum”  
- “Hangi evrak lazım kimse net söylemiyor”  
- “İki kez gittim, bir belge eksikmiş”  
- “ChatGPT uyduruyor, TR’ye uymuyor”

### Trigger olaylar

Taşınma, iş değişikliği, evlilik/nişan, araç alım-satım, bebek, yurt dışı seyahat, miras/veraset, askerlik, emeklilik.

---

## 4. Ne sunuyoruz?

### MVP (v1)

- 15–20 **hayat olayı** şablonu (editöryel)  
- Her olay için: belge listesi, adımlar, linkler, süre tahmini, “sık hata”  
- Favoriler + push hatırlatma  
- Arama: “ikametgah”, “araç satış”, “pasaport”  
- Offline okunabilir checklist  

### v1.5 (GCP / Gemini)

- Belge fotoğrafı → tür tanıma + “bu olay için uygun mu?”  
- Kullanıcı durumu soruları → kişiselleştirilmiş adım listesi  
- Basit dilekçe **şablonu** (CİMER / kurum formu taslağı — hukuki tavsiye değil)

### Monetizasyon (pricing skill)

| Plan | Fiyat bandı (TR) | İçerik |
|------|------------------|--------|
| Ücretsiz | 0 | 3 popüler olay + reklam (opsiyonel) |
| Premium aylık | ₺59–79 | Tüm olaylar + hatırlatma + AI kota |
| Premium yıllık | ₺399–499 | ~2 ay bedava |
| Tek seferlik “iş paketi” | ₺29–49 | Tek hayat olayı (düğün/taşınma sezonu) |

PPP: TR abonelikler US’ye göre ~%70 daha düşük (Mirava 2025). Hacimle kazan.

**Hormozi money model:** Ücretsiz checklist → tek seferlik paket (nakit) → aylık abonelik (continuity).

---

## 5. Kime?

| Persona | Profil | Neden öder? |
|---------|--------|-------------|
| İlk kez bürokrasi gören (20–30) | Öğrenci / yeni mezun | Pasaport, işe giriş, askerlik |
| Taşınan aile (28–40) | Kiracı / yeni ev | İkametgâh, abonelik devri, okul nakil |
| Araç alıp satan (25–45) | Bireysel | Noter + vergi + ruhsat sırası |
| Küçük esnaf (yan) | Mikro işletme | Vergi levhası, SGK işe giriş — **v2** |

Anti-persona: Avukatlar, profesyonel aracılar, kurumsal hukuk ekipleri.

---

## 6. Rekabet haritası

| Oyuncu | Ne yapıyor | Bizden fark |
|--------|------------|-------------|
| ChatGPT / Gemini | Genel AI | TR prosedür + checklist + hatırlatma + ASO nişi yok |
| EvrakAI / HukukChat | Dilekçe / UYAP / avukat | Biz vatandaş hayat olayı; onlar hukuk üretimi |
| e-Devlet | Resmi işlem | Keşif ve “ne yapacağım” rehberi yok |
| Blog / YouTube | İçerik | Push, kişiselleştirme, AI OCR yok |
| TaksitDefter (sen) | Taksit/abonelik | Farklı kategori — çapraz link mümkün |

**Boşluk:** “Hayat olayı → belge + sıra + hatırlatma” ürünleşmiş, güvenilir, Türkçe, Android-native uygulama seyrek.

---

## 7. Neden gelir ihtimali yüksek?

1. **Tekrarlayan ihtiyaç:** Yılda birkaç büyük işlem + sürekli küçük sorgular.  
2. **Yüksek niyet:** Randevu/noter öncesi ödeme isteği yüksek.  
3. **ASO:** “e devlet nasıl”, “ikametgah belgesi”, “araç satış evrakları”, “pasaport randevu” — intent dolu.  
4. **Eğitim kategorisi kanıtı:** TR’de dar niş abonelikler (KPSS, ehliyet) top-grossing’e giriyor → “acil ihtiyaç + abonelik” modeli çalışıyor.  
5. **AI indirme dalgası:** Adjust — üretken AI indirmeleri TR’de +%142 (2024); ama **niş AI** genel chat’ten ayrışıyor.

---

## 8. Maliyet / GCP kredisi

| Kalem | Yaklaşım |
|-------|----------|
| Backend | Firebase Auth + Firestore + FCM |
| AI | Gemini API (Vertex/AI Studio) — kredi |
| İçerik | İlk 20 olay: founder + 1 editör freelance |
| Bildirim | FCM ücretsiz kotası |
| UA | Organik ASO + TikTok/Reels “şu belgeyi unutma” — düşük bütçe |
| Hukuk | Disclaimer + içerik review (tek seferlik avukat bakışı) |

**Yapma:** Banka/e-Devlet resmi entegrasyonu (izin/regülasyon).

---

## 9. Riskler

| Risk | Mitigasyon |
|------|------------|
| Mevzuat değişir | Kaynak URL + “son doğrulama tarihi” + kullanıcı bildirimi |
| Yanlış yönlendirme | Disclaimer; kritik işlemlerde “kurumu doğrula” |
| ChatGPT yeter derler | Offline checklist + hatırlatma + TR ASO + OCR |
| İçerik üretimi yavaş | Önce en çok aranan 15 olay |

---

## 10. MVP başarı metrikleri (ilk 90 gün)

- 5.000 organık indirme  
- D1 retention ≥ %25 (utility için iyi)  
- Free → paid ≥ %3–5  
- En çok kullanılan 5 olay netleşsin  
- Play puanı ≥ 4.3  

---

## 11. Positioning cümlesi (Dunford)

> **İşlemRehberi**, Türkiye’de hayat olaylarını (taşınma, evlilik, araç, pasaport…) **doğru belge ve sırayla** bitirmek isteyenler için; ChatGPT’nin genel cevabı ve e-Devlet’in ham arayüzü yerine **adım adım, hatırlatmalı, Türkçe işlem rehberi** sunar.

---

## 12. İlk 10 hayat olayı (MVP aday listesi)

1. İkametgâh / adres değişikliği  
2. Pasaport başvurusu  
3. Ehliyet yenileme / sağlık raporu yolu  
4. Araç satış (noter öncesi)  
5. Araç alış (tescil sonrası)  
6. İşe giriş (SGK / işveren evrakları — çalışan tarafı)  
7. Evlilik başvurusu  
8. Doğum / nüfus kaydı  
9. Öğrenci belgesi / mezuniyet  
10. CİMER başvurusu nasıl yazılır (şablon)

---

## 13. Onay sorusu

Bu fikri Spec Kit’e kilitleyelim mi, yoksa önce B (AraçAl) ile A/B discovery mi?
