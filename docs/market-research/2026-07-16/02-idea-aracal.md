# Fikir B — AraçAl Asistanı (İkinci öneri)

**Çalışma adı:** AraçAl / AlmadanÖnce / EkspertizCebim  
**Play kategorisi:** Auto & Vehicles (ikincil: Lifestyle)  
**Platform:** Android-first  
**Tarih:** 2026-07-16

---

## 1. Nedir?

İkinci el araç alırken kullanıcının **dolandırılmadan, eksik kontrol yapmadan** karar vermesini sağlayan mobil asistan:

- Adım adım **alım checklist** (ilan → görüşme → ekspertiz → noter)  
- **Ne sorgulanır, nasıl:** 5664 SMS, SBM/Sigortam360, e-Devlet (yönlendirme — resmi API iddiası yok)  
- **Kırmızı bayraklar:** fiyat çok düşük, plaka/şasi uyumsuzluğu, “acil satılık” baskısı  
- **Pazarlık script’i** ve soru listesi  
- (Premium) **Fotoğraftan hasar/iz AI tahmini** (Gemini Vision) + “ekspertize git” önerisi  
- Masraf tahmini: muayene, sigorta, vergi, lastik, bakım (kaba)

## 2. Nedir değildir?

| Değil | Neden |
|-------|--------|
| Resmi TRAMER / SBM rakibi | Veri SBM’de; ücretli SMS/uygulama var |
| Ekspertiz firması | Sahada boya ölçümü yapmıyoruz |
| Araç ilan marketplace | Sahibinden / Arabam.com |
| Araç gider takip (Drivvo/Carpad) | Onlar “sahip olduktan sonra”; biz “almadan önce” |
| TaksitDefter | Kredi kartı taksiti yok (araç kredisi hesabı v2 olabilir) |

---

## 3. Neden bu?

- Türkiye’de ikinci el araç pazarı büyük; hasar/km/rehin korkusu **akut acı**.  
- İnsanlar zaten 5664’e ~₺60 SMS atıyor → **ödeme alışkanlığı kanıtlı**.  
- Carpad/Drivvo **sahip sonrası**; alım öncesi “karar destek” boşluğu daha net.  
- Yüksek LTV değil ama **yüksek intent + tek seferlik paket** güçlü (araba alımı seyrek ama pahalı karar).

### JTBD

- Fonksiyonel: “Hasarlı/sorunlu aracı almamak”  
- Duygusal: “Pişman olmamak”  
- Sosyal: “Aileme yanlış araba almış gibi görünmemek”

---

## 4. Ne sunuyoruz?

### Ücretsiz

- Temel checklist (20 madde)  
- “Bu ilanda şunları sor” kartları  
- 5664 / SBM nasıl sorgulanır rehberi  

### Premium / paket (₺79–149 tek seferlik “alım paketi”)

- Tam checklist + PDF rapor  
- AI foto analizi (N foto)  
- Pazarlık ve ekspertiz firması seçim ipuçları  
- “Noter günü belgeler” listesi  

### Abonelik (daha zayıf fit)

Galericiler / sık al-sat için ₺99/ay — B2B yan ürün.

---

## 5. Rekabet

| Oyuncu | Konum | Boşluk |
|--------|-------|-------|
| SBM / 5664 / Sigortam360 | Resmi hasar sorgusu | Rehber + checklist + AI yok |
| Hesapkurdu / Sigortam.net içerik | Blog | App + hatırlatma yok |
| Carpad, Drivvo, CORVIA | Sahip sonrası takip | Alım kararı değil |
| Arabam.com / Sahibinden | İlan | Tarafsız “alıcı asistanı” değiller |

---

## 6. GCP kredisi

- Gemini Vision: boya izi / ezik / lastik aşınması **tahmini** (disclaimer zorunlu)  
- Firebase: checklist progress, rapor PDF  
- **Yapma:** SBM scraping (yasadışı / ToS)

---

## 7. Riskler

| Risk | Mitigasyon |
|------|------------|
| “Hasarsız dediniz” davası | AI = tahmin; ekspertiz şartı metni |
| Seyrek kullanım (yılda 1) | Tek seferlik paket + galeri B2B |
| Düzenleyici | Resmi sorgu iddiası yok; “nasıl yapılır” |

---

## 8. Skor özeti

Ağırlıklı **8.1** — A’dan biraz düşük çünkü:

- Kullanım frekansı düşük (abonelik zor)  
- SBM ekosistemi zaten para alıyor  
- Ama **tek seferlik ARPU** yüksek olabilir  

**Ne zaman B seçilir?** Founder araç/oto tutkusu varsa veya viral “sahibinden ilanı skorla” Reels stratejisi güçlüyse.
