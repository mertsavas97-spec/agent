# Google Cloud kurulum rehberi (US5 sonrası)

> Bu dosya **senin (owner)** yapman gereken adımlar. Kod tarafı US5’te durdu;
> Gemini + Vision key’leri gelmeden **US6’ya geçmeyiz**.
>
> Amaç: canlı AI + gerçek SafeSearch. Play Billing ayrı (US6).

Tahmini süre: ilk kez ~45–90 dk (hesap/fatura doğrulamalarına göre).

---

## Ne kuracağız? (özet)

| # | Ne | Ne için |
|---|----|---------|
| 1 | Google Cloud projesi | Faturalandırma + API’ler |
| 2 | Faturalandırma hesabı / kredi | Gemini + Vision ücretleri |
| 3 | **Gemini API key** | Soru çözme + “Anlamadım” |
| 4 | **Cloud Vision API** (+ key veya ADC) | SafeSearch (uygunsuz görsel) |
| 5 | **Firebase** projesi (aynı GCP’ye bağlı) | Auth, Firestore, Storage, Functions |
| 6 | Key’leri Functions’a yazma | `demo` → `live` AI |

Şimdilik **gerekmez:** Play Console abonelik, domain, App Store.

---

## Aşama 0 — Hazırlık

1. Gmail / Google hesabın açık olsun (tercihen iş için ayrı hesap).
2. Elimde olsun:
   - Kredi kartı (Google Cloud faturalandırma; Startup kredisi varsa onu da kullanabilirsin)
   - Telefon (SMS doğrulama)
3. Not defteri aç: aşağıda üreteceğin değerleri yapıştıracaksın:
   - `GCP_PROJECT_ID`
   - `GEMINI_API_KEY`
   - `GOOGLE_CLOUD_VISION_API_KEY` (veya service account yolu)
   - Firebase web config (`EXPO_PUBLIC_FIREBASE_*`)

---

## Aşama 1 — Google Cloud projesi

1. Aç: [https://console.cloud.google.com](https://console.cloud.google.com)
2. Üstten **Select project** → **New Project**
3. İsim önerisi: `cozbil-prod` (veya `cozbil-dev`)
4. **Create** → proje seçili kalsın
5. Proje kimliğini (Project ID) not et → `GCP_PROJECT_ID`

---

## Aşama 2 — Faturalandırma (kredi)

1. Sol menü: **Billing** → bu projeyi bir faturalandırma hesabına bağla
2. Kart / Startup kredisi:
   - Varsa **Google for Startups Cloud Program** / Gemini kredini bu billing account’a tanımla
   - Yoksa standart ücretsiz deneme + kart ile devam (ücretler kullanıma göre)
3. Kontrol: Billing → proje **Linked** görünmeli

> Key’ler billing’siz projede çoğu zaman API’yi açmaz veya hemen 403 verir.

---

## Aşama 3 — Gemini API key

1. Aç: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)  
   (veya Cloud Console → **APIs & Services** → **Gemini API** / Generative Language API’yi Enable)
2. **Create API key** → key’i **bir kere** kopyala, güvenli yere yapıştır
3. Key’i GitHub’a / chat’e **yapıştırma**
4. Not et → `GEMINI_API_KEY`

İsteğe bağlı güvenlik:

- Key’i sadece kendi IP / uygulamana kısıtla (sonra sıkılaştırabilirsin)
- Ayrı “dev” ve “prod” key tercih edilir

---

## Aşama 4 — Cloud Vision API (SafeSearch)

1. Cloud Console → **APIs & Services** → **Library**
2. Ara: **Cloud Vision API** → **Enable**
3. **Credentials** → **Create credentials** → **API key**
4. (İsteğe bağlı) Key restriction: yalnızca Cloud Vision API
5. Not et → `GOOGLE_CLOUD_VISION_API_KEY`

> Kodumuz Vision’ı HTTP + API key ile çağırıyor. Key yoksa şimdilik “temiz görsel” kabul ediyor (dev).

---

## Aşama 5 — Firebase projesi (aynı GCP)

1. Aç: [https://console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → mevcut GCP projesini seç (`GCP_PROJECT_ID`)
3. Google Analytics: isteğe bağlı (MVP’de kapatabilirsin)
4. Firebase’de aç:

### 5a. Authentication
- **Build → Authentication → Get started**
- Sign-in method: **Anonymous** → Enable  
- (İleride) Email/Password → Enable

### 5b. Firestore
- **Build → Firestore Database → Create database**
- Mod: **production** (rules zaten repoda deny-by-default + user-scoped)
- Konum önerisi: `europe-west1` (veya `eur3`) — seçtikten sonra değişmez, not et

### 5c. Storage
- **Build → Storage → Get started**
- Aynı bölgeye yakın seç

### 5d. Functions
- **Build → Functions** → Blaze (pay-as-you-go) plan gerekir — Billing bağlıysa yükselir
- Region: mümkünse `europe-west1` (mobil client şu an bu region’a bakıyor)

### 5e. Web / Android app kaydı
- Project Overview → **Add app** → Web → nickname `cozbil-mobile`
- Çıkan config’i not et:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

- Android app (package: sonra `app.json` ile hizalanacak) — Play’e çıkarken eklenir

---

## Aşama 6 — Rules & deploy (bana / ajana verilecek iş)

Sen key’leri hazırladıktan sonra biz (veya sen CLI ile):

1. `firebase use <GCP_PROJECT_ID>`
2. `firebase deploy --only firestore:rules,storage`
3. `firebase functions:config` veya Secret Manager / `.env` ile:

```bash
# Functions ortamı (örnek — gerçek komut sprintte netleşir)
GEMINI_API_KEY=...
GOOGLE_CLOUD_VISION_API_KEY=...
COZBIL_DEMO_AI=0
```

4. Mobil `.env`:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_USE_EMULATORS=0
```

5. Deploy functions → `ping` cevabında `aiMode: "live"` görmelisin

---

## Aşama 7 — Doğrulama checklist (sen + biz)

- [ ] Billing linked
- [ ] Gemini API key çalışıyor (AI Studio’da tek prompt test)
- [ ] Vision API enabled + key
- [ ] Firebase Auth Anonymous açık
- [ ] Firestore + Storage oluşturuldu
- [ ] Functions Blaze
- [ ] Web app config kopyalandı
- [ ] Key’ler **sadece** secret/env’de (repo’da yok)
- [ ] `ping` → `"aiMode":"live"`
- [ ] Bir gerçek matematik sorusu fotoğrafı → adımlı çözüm (demo metni değil)

---

## Bana (koordinatöre) ne göndermelisin?

Chat’e **key yapıştırma**. Şunu yazman yeterli:

1. “GCP hazır”  
2. Project ID  
3. Region (Firestore/Functions)  
4. Key’leri nereye koyduğunu (ör. 1Password / local `.env` — içerik değil)  
5. `ping` ekran görüntüsü veya `aiMode` satırı  

Biz US6’ya (paywall + kota) geçeriz.

---

## Sık hatalar

| Belirti | Muhtemel neden |
|---------|----------------|
| 403 / API not enabled | Aşama 3 veya 4 Enable unutuldu |
| Billing hatası | Aşama 2 proje bağlı değil |
| Hâlâ demo çözüm | `GEMINI_API_KEY` Functions’a gitmedi veya `COZBIL_DEMO_AI=1` |
| Auth fail | Anonymous kapalı / yanlış `projectId` |
| Storage upload fail | Rules deploy edilmedi / path `users/{uid}/...` değil |

---

## Bu rehberin dışında kalanlar (sonra)

- Google Play Console + Billing (US6)
- KVKK metin danışmanı (store öncesi)
- Production App Check / key restriction sıkılaştırma
