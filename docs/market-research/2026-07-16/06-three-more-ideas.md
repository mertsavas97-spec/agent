# Ek 3 fikir (A/B/C dışı) — 2026-07-16

Önceki paketteki **İşlemRehberi / AraçAl / Sınav wedge** dışında, aynı kısıtlarla (TR, Android, düşük maliyet, GCP kredisi, TaksitDefter değil) üç yeni alternatif.

| | F · FaturaRadar | G · VizeDosyam | H · EvBakımCebim |
|--|-----------------|----------------|------------------|
| Kategori | Tools / Finance-adjacent | Travel / Productivity | Lifestyle / House & Home |
| Açlık | Yüksek (fatura şoku) | Yüksek (sezon + stres) | Orta-yüksek (kombi/klima) |
| TR moatı | Tarifeler, kademe, EPDK | Konsolosluk/ikamet kuralları | Kombi, garanti, yetkili servis kültürü |
| Solo maliyet | Düşük-orta (OCR + kurallar) | Düşük (checklist + AI form) | Düşük |
| Monetizasyon | Abonelik + affiliate tarife | Tek seferlik “vize paketi” | Abonelik / yıllık |
| GCP | Gemini fatura OCR | Gemini form/belge | Gemini garanti belgesi OCR |
| A/B/C’den fark | İşlem rehberi değil; **fatura zekâsı** | Genel bürokrasi değil; **sadece vize** | Araç alım değil; **ev cihaz bakımı** |

---

## F · FaturaRadar

### Nedir?
Elektrik / doğalgaz / su / internet faturalarını fotoğrafla okuyan, **ne ödediğini anlaşılır hale getiren** ve “daha ucuz tarife / tasarruf” öneren Android app.

### Nedir değildir?
- TaksitDefter (taksit/abonelik takvimı değil)
- Gediz vb. tek tedarikçi app’i
- Banka ödeme uygulaması
- Tam tarife marketplace (Akıllı Tarife web’inin klonu değil — mobil OCR + kişisel geçmiş)

### Ne sunuyoruz?
- Fatura OCR → kWh, birim fiyat, kademe, vergiler ayrıştırma  
- Aylık trend + “bu ay neden arttı?”  
- Bölgene göre tarife/tasarruf ipuçları (editöryel + affiliate)  
- Abonelik iptal / taşıma **adım linkleri** (İşlemRehberi’ne soft bağlanabilir ama ürün ayrı)

### Neden?
Enflasyon döneminde fatura acısı sürekli; insanlar zaten karşılaştırma sitelerini okuyor ama **kendi faturasını anlamıyor**. Gemini kredisi OCR’ye birebir.

### Para
- Premium ₺49–69/ay (sınırsız OCR + rapor)  
- veya yıllık ₺299  
- Affiliate: tarife/internet geçiş (şeffaf disclosure)

### Risk
Tarife verisi güncelliği; affiliate güveni; TaksitDefter ile “abonelik” kelimesi karışmasın → konumlandırma: **fatura okuma & tasarruf**.

---

## G · VizeDosyam

### Nedir?
Schengen / İngiltere / ABD / Kanada vb. için **ülke+vize tipine özel belge checklist**, randevu geri sayımı, başvuru formu doldurma asistanı (AI), randevu kaçırmama bildirimleri.

### Nedir değildir?
- Genel İşlemRehberi (tüm devlet işleri)
- Vize acentesi / randevu satıcısı (VFS randevu botu — ToS/etik risk)
- Garanti “vize çıkar” iddiası

### Ne sunuyoruz?
- Ülke × vize tipi şablonları (turistik, öğrenci, aile birleşimi…)  
- Belge listesi + örnek foto kuralları  
- Form alanlarını Türkçe açıkla → İngilizce/hedef dil taslak  
- Randevu / biyometri günü countdown  
- “Eksik belge” self-check

### Neden?
Yüksek niyet + ödeme isteği (vize ücreti zaten pahalı → ₺149–299 paket ucuz kalır). Sezonluk spike (yaz, eğitim). ASO: “schengen vize evrakları”, “İtalya vize checklist”.

### Para
- Tek seferlik ülke paketi ₺149–249  
- Premium yıllık çoklu başvuru ₺399  
- Hukuki disclaimer zorunlu

### Risk
Konsolosluk kural değişimi; “garanti” algısı; randevu botu tuzağına düşme.

---

## H · EvBakımCebim

### Nedir?
Evdeki **kombi, klima, şofben, çamaşır/buzdolabı** için bakım takvimi, garanti belgesi arşivi, yetkili servis öncesi checklist, arıza tarif asistanı (AI).

### Nedir değildir?
- Usta marketplace (GetirÇek/Armut yarışı)
- Site yönetimi / aidat (Apsiyon)
- Araç bakım (Carpad)
- Genel “todo”

### Ne sunuyoruz?
- Cihaz ekle (marka/model/alıntarihi)  
- Yıllık kombi bakımı, klima gazı, filtre hatırlatma (kış/yaz trigger — TR’ye özgü)  
- Garanti belgesi / fatura OCR arşiv  
- “Bu ses ne?” / arıza ağacı (disclaimer: usta şart)  
- Kış öncesi “kombi bakımı checklist” push (viral sezon)

### Neden?
Türkiye’de kombi kültürü + kış acil servis pahası → **önleyici hatırlatma** için ödeme mantıklı. Düşük yapım maliyeti; net ASO (“kombi bakım ne zaman”, “klima bakım hatırlatıcı”).

### Para
- Ücretsiz 1 cihaz  
- Premium ₺39–59/ay veya ₺199/yıl (sınırsız cihaz + OCR + aile paylaşımı)

### Risk
Marketplace’e kayma isteği (yapma); tıbbi/yangın güvenlik claim’leri (yapma).

---

## Kısa skor (A/B/C ile aynı ölçek, kabaca)

| | Ağırlıklı ~ |
|--|-------------|
| FaturaRadar | ~7.9 |
| VizeDosyam | ~8.0 |
| EvBakımCebim | ~7.6 |

Hepsi A (8.7) altında ama **farklı kategori**; portföy veya A’dan sonra ikinci ürün adayı.

---

## Seçim rehberi

| İstediğin | Seç |
|-----------|-----|
| GCP OCR’yi en çok kullanmak + sürekli kullanım | **FaturaRadar** |
| Yüksek tek seferlik ödeme, net paket | **VizeDosyam** |
| En basit MVP, sezonluk viral (kış) | **EvBakımCebim** |
