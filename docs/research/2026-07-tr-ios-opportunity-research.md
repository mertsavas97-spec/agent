# Türkiye iOS App Fırsat Araştırması — Temmuz 2026

**Kapsam:** iOS-first, Türkiye pazarı  
**Kısıtlar:** Taksit/abonelik takip ve sınav AI (ehliyet/KPSS/YGS) **hariç**  
**Filtre:** Düşük işletme maliyeti (mümkünse on-device, LLM API’siz), monetizasyon (premium / AdMob) mantıklı  
**Tarih:** 2026-07-31  
**Kaynaklar:** App Store TR ranking (apptail ~30 Tem 2026), Apple TR 2025 yıl sonu listeleri, AppMagic/Türkiye mobil gelir notları, yerel App Store listeleri, kamu DOA/e-Devlet haberleri

---

## 1) Pazar özeti (ne oluyor?)

| Sinyal | Bulgu | Kurucu için anlam |
|--------|--------|-------------------|
| Ücretsiz indirme | AI asistanlar (ChatGPT, Gemini), e-ticaret/yemek, e-Devlet/e-Nabız, CapCut, DOA resmi app | Genel AI wrapper ve marketplace’e **girme**; yerel “günlük hayat utility” ye gir |
| Ücretli chart (Tem 2026) | Shadowrocket, Deprem Ağı, Live Vintage Camera, Lügat, PARA KONTROL, Pomodoro, ders programı, resim dönüştürücü, Anki | **Tek iş + net fayda + paid/freemium** hâlâ satıyor |
| Top grossing | YouTube, ChatGPT, oyun, CapCut, kısa drama, dating | Grossing’in çoğu yüksek içerik/UA maliyeti → bootstrap için **kaçın** |
| Makro | TR mobil gelir monetizasyona kayıyor; utility IAP büyümesi geçmişte çok güçlü; iOS harcama Android’den daha istekli | iOS-first freemium/subscription doğru kanal |
| Kullanıcı davranışı | “Minimal ama işe yarayan 10–15 app”; güvenlik + yerel zorunluluk + depolama | Tek ekranlı, bildirimli, Türkçe ASO güçlü ürünler |

**Arz–talep denklemi (genel):**  
Talep (indirim + ücret ödeme isteği) utility / lifestyle / lokal ihtiyaçta yüksek. Arz: global klonlar bol, **Türkiye’ye özel dikey + on-device + temiz UX** seyrek. En iyi fırsat = “yüksek frekanslı acı” × “zayıf yerelleştirilmiş çözüm” × “aylık sunucu maliyeti ~0”.

---

## 2) Bilinçli eleme (bu araştırma dışı)

| Fikir tipi | Neden ele |
|------------|-----------|
| Taksit / abonelik / bütçe tracker | Zaten yaptınız; Hane, Ovlo, butce.app, Cep Muhasebe rekabet yoğun |
| Sınav AI (ehliyet, KPSS, YGS/LGS) | Zaten yaptınız (ÇözBil); chart’ta JSPS / Vergi Akademisi Pro benzeri doygunluk |
| Genel ChatGPT klonu | Maliyet + ChatGPT/Gemini duvarı |
| Kısa drama / UGC video | İçerik + lisans maliyeti yüksek |
| VPN / proxy | Chart’ta var ama App Review + yasal gri alan |
| Deprem erken uyarı | Deprem Ağı + Pro ücretli lider; güven + sensör ağı moatı |

---

## 3) Skor kartı (0–5)

**Ağırlıklar:** Talep (25%) · Arz boşluğu (20%) · Monetizasyon (20%) · Maliyet düşüklüğü (20%) · Basitlik/MVP hızı (15%)

---

## 4) Önerilen fikirler (maliyet istemeyen öncelikli)

### A) TOP TAVSİYE — “TR Belge & Süreç Hatırlatıcı” (pasaport / ehliyet yenileme / vergi / askerlik / muayene / MHRS değil randevu notu)

**Ne:** Kullanıcı tarihleri girer (veya şablon seçer); 30/14/7/1 gün önce bildirim. Şablonlar TR’ye özel: pasaport, ehliyet yenileme, MTV, sigorta, muayene, askerlik işlem, oturum/ikamet, sözleşmeli iş bitiş, e-Devlet “şu belge lazım” checklist.  
**Talep:** Yüksek — unutulan resmi süreler ceza/masraf üretir. Banka app’leri (İşCep Aracım vb.) parça parça çözüyor; **tek “hayat süreleri” app** zayıf.  
**Arz:** Generic reminder bol; TR şablon + ceza riski dili + offline az. Araç-odaklı app’ler var → siz **araç dışı + araç birleşik “kimlik/evrak ömrü”** ile farklılaşın.  
**Monetizasyon:** Freemium — 3 hatırlatıcı ücretsiz; sınırsız + widget + aile paylaşımı Premium (haftalık/yıllık). AdMob banner opsiyonel free tier.  
**Maliyet:** ~0 (local notifications, SwiftData/Core Data).  
**Risk:** App Store “utility hatırlatıcı” kalabalığı → ASO’da TR keyword (pasaport yenileme, ehliyet süresi) şart.  
**Skor:** Talep 5 · Boşluk 4 · Mono 4 · Maliyet 5 · MVP 5 → **~4.6**

---

### B) TOP TAVSİYE — “Film / Vintage Kamera” (TR ASO + tek iş)

**Ne:** Tek dokunuş film grain, ışık sızıntısı, 90’lar/2000’ler TR estetik preset’leri; watermark’sız export Premium.  
**Talep:** Temmuz 2026 ücretli chart’ta Live Vintage Camera üst sıralarda; CapCut ücretsiz indirmede yüksek ama “basit kamera” ayrı iş.  
**Arz:** Global çok; **Türkçe UX + yerel preset isimleri + düşük fiyat** ile hâlâ oda açılıyor.  
**Monetizasyon:** Ücretli app (99–199 TL) **veya** freemium + yıllık; reklam az (foto kategorisi premium bekler).  
**Maliyet:** On-device Metal/Core Image; sunucu yok.  
**Risk:** Taklit kolay; tasarım/marka farkı şart.  
**Skor:** 4.4

---

### C) TOP TAVSİYE — “PDF / Fiş / Evrak Kasası” (on-device OCR + klasörler)

**Ne:** Kameradan fiş/fatura/sözleşme tara → cihaz içi OCR → klasör (kira, sağlık, araç, iş). Arama + Face ID. Bütçe/taksit **yapmaz** (sizin eski üründen ayrışır).  
**Talep:** Kağıtsızlaşma + e-Devlet belgesi birikimi; muhasebeciye PDF yığma acısı.  
**Arz:** Scanner Pro global pahalı; TR-odaklı “evrak kasası” seyrek.  
**Monetizasyon:** Haftalık/yıllık Premium (OCR sayfası limiti free); AdMob free.  
**Maliyet:** Apple Vision OCR on-device; LLM yok.  
**Risk:** Privacy copy net olmalı (KVKK: cihazda kalır).  
**Skor:** 4.3

---

### D) Güçlü — “Ne Giysem?” (hava + gardırop)

**Ne:** Şehir hava (ücretsiz API) + dolaptaki kıyafet fotoğrafları → günlük kombin önerisi; iş/okul/gezi modları.  
**Talep:** Lifestyle + genç kadın/erkek iOS kitlesi; Pinterest/CapCut komşu davranış.  
**Arz:** Global closet app’ler var; TR hava + Türkçe + basitlik zayıf.  
**Monetizasyon:** Premium sınırsız kıyafet + widget; AdMob free.  
**Maliyet:** Düşük (hava API free tier); AI opsiyonel sonra.  
**Risk:** Retention zor → günlük widget + bildirim şart.  
**Skor:** 3.9

---

### E) Güçlü — “Site / Apartman Mini” (aidat + duyuru + arıza kaydı)

**Ne:** Tek site için: aidat ödendi mi (manuel tick), duyuru panosu, arıza ticket, ortak gider notu. Yönetici 1 Premium, sakinler free.  
**Talep:** TR’de site yaşamı yaygın; WhatsApp grup kaosu.  
**Arz:** Ağır proptech var; **tek site, 1 günde kurulan, reklamsız basit** boşluk.  
**Monetizasyon:** Yönetici aylık/yıllık; veya sakin başına düşük sub. AdMob sakin free.  
**Maliyet:** Başta tamamen local+iCloud share; sonra ucuz Firebase.  
**Risk:** Viral loop (yönetici daveti) olmadan UA pahalı.  
**Skor:** 3.8

---

### F) Orta-güçlü — “Pomodoro / Odak” TR white-collar

**Ne:** Minimal pomodoro + günlük hedef + sessiz mod; öğrenci değil **ofis** dili.  
**Talep:** Ücretli chart’ta POMO-DORO var → ödeme kanıtı.  
**Arz:** Aşırı kalabalık.  
**Monetizasyon:** Paid unlock ads / yıllık.  
**Maliyet:** 0.  
**Risk:** Differentiator yoksa ölür → ancak “TR ofis + widget + Apple Watch” ile.  
**Skor:** 3.2 (sadece design-led gir)

---

### G) Orta — “Kelime / Lügat yan ürünü” (iş İngilizcesi flashcard, Anki-lite)

**Ne:** Günlük 10 kelime, iş mail kalıpları; YDS/KPSS değil.  
**Talep:** Lügat + AnkiMobile ücretli chart’ta; Learna free chart’ta.  
**Arz:** Yoğun.  
**Monetizasyon:** Premium.  
**Maliyet:** İçerik elle veya bir kerelik; API gerekmez.  
**Risk:** ÇözBil eğitim markasıyla karışmasın; ayrı brand.  
**Skor:** 3.1

---

### H) Dikkatli fırsat — “DOA / depozito yardımcı” (resmi app rakibi değil)

**Ne:** Resmi DOA app’in yanında: evde biriken şişe sayacı, iade rotası planı, aile skor tahtası, “bu hafta kaç TL iade”. Resmi ödeme/cüzdan **yok**.  
**Talep:** DOA free top chart’ta → konu hot.  
**Arz:** Resmi app baskın; yan utility boş olabilir.  
**Monetizasyon:** AdMob + tip jar / Premium istatistik.  
**Maliyet:** Düşük.  
**Risk:** Kullanıcı resmi app’e gider; App Review “yanıltıcı resmi” iddiası → branding net: “takip asistanı, resmi değil”.  
**Skor:** 3.0

---

### I) Kaçın / ertele — Bebek aşı all-in-one

Resmi Annelik Yolculuğu + ebeveyn.app + Kiddex + Bebio + Pediatrik Gelişim → **arz yüksek**. Sadece çok dar açı (ör. “sadece aşı PDF + aile paylaşımı”) düşünülürse belki; genel bebek app **önermiyoruz**.

---

## 5) Karşılaştırmalı tablo

| Fikir | Talep | Arz boşluğu | Mono | Maliyet | MVP hız | Toplam | Öncelik |
|-------|-------|-------------|------|---------|---------|--------|---------|
| A Belge/süre hatırlatıcı | 5 | 4 | 4 | 5 | 5 | **4.6** | P0 |
| B Vintage kamera | 5 | 3 | 5 | 5 | 4 | **4.4** | P0 |
| C Evrak kasası OCR | 4 | 4 | 4 | 5 | 4 | **4.3** | P0 |
| D Ne giysem | 4 | 3 | 4 | 4 | 4 | **3.9** | P1 |
| E Site mini | 4 | 4 | 4 | 3 | 3 | **3.8** | P1 |
| F Pomodoro | 3 | 2 | 4 | 5 | 5 | **3.2** | P2 |
| G İş İngilizcesi lite | 3 | 2 | 4 | 4 | 3 | **3.1** | P2 |
| H DOA asistan | 4 | 3 | 3 | 5 | 4 | **3.0** | P2 |

---

## 6) Monetizasyon playbook (TR iOS 2026)

1. **Önce yıllık Premium** (en iyi LTV); haftalık agresif paywall test (utility’de işe yarıyor, abuse riski var).  
2. **Free + AdMob** sadece yüksek session utility’de (hatırlatıcı, DOA sayaç); foto/kamera’da reklam UX’i bozar → paid/unlock tercih.  
3. **Fiyat:** TR satın alma gücü için “ucuz yıllık + pahalı haftalık” klasik micro-SaaS mobile.  
4. **UA:** İlk 90 gün organik ASO (Türkçe uzun kuyruk) + App Store Screenshots “ceza/unutma/GB boşalt” acı dili. Paid UA ikincil.  
5. **Maliyet tavanı:** Aylık API + sunucu **&lt; 50 USD** hedefi; aksi halde fikir elenir.

---

## 7) Arz–talep özeti (tek cümle)

> Türkiye iOS’ta 2026’da para, “yapay zekâ oyunu”ndan çok **unutulan resmi işler, görsel eğlence ve cihaz-içi düzen** için ödeniyor; arz global klonlarla dolu ama **TR şablon + on-device + tek vaat** hâlâ boş.

---

## 8) Kurucu karar önerisi (90 gün)

**Build sırası:**
1. **A — Belge & süre hatırlatıcı** (en hızlı MVP, en düşük maliyet, ÇözBil’den net ayrışır)  
2. Paralel design spike: **B — Vintage kamera** (ücretli chart kanıtı)  
3. V1 traction yoksa pivot: **C — Evrak kasası**

**Yapma:** Yeni finans tracker, yeni sınav AI, ChatGPT sarmalayıcı, kısa drama.

---

## 9) Varsayımlar & sınırlar

- Ranking anlık; Temmuz sonu 2026 snapshot.  
- TAM/SAM sayısal model bu brifte yok (karar için skor + qualitative yeterli).  
- Hukuki: hatırlatıcı app resmi danışmanlık iddia etmemeli; DOA asistan resmi app gibi görünmemeli.  
- ÇözBil exam scope ile çakışma yok (bu araştırma side-product).
