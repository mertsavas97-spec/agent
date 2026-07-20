# Kişisel telefona lokal native build (Expo Go yok)

Amaç: Telefona **bir kez** ÇözBil development build kurmak; sonra JS/UI güncellemelerini
**aynı uygulama üzerinden** Metro ile saniyeler içinde almak.

> Cloud agent telefona USB ile bağlanamaz. Build **Mac’inde** çalışır.

## Günlük akış (istediğin model)

| Ne zaman | Komut | Ne olur |
|----------|--------|---------|
| **İlk kurulum / native değişti** | `bash scripts/phone-dev-build.sh android` veya `ios` | Telefona gerçek `.apk` / app kurulur |
| **Her kod güncellemesi** | `bash scripts/phone-dev-build.sh metro` | Aynı app açılır, JS hot reload / fast refresh |
| **Farklı ağ / tethering** | `... metro --tunnel` | ngrok tunnel ile bağlanır |

Native paket eklenmedikçe (kamera lib, SDK upgrade, `app.json` plugin) **yeniden build gerekmez**.

---

## 0) Mac hazırlık (bir kez)

```bash
cd ~/Desktop/cozbil   # yoksa: git clone … && checkout branch
git pull origin cursor/cozbil-polish-capture-loading-9131
bash scripts/setup-desktop-macos.sh
# apps/mobile/.env dolu olmalı (Firebase)
```

### Android telefon
1. Ayarlar → Telefon hakkında → **Yapı numarası** 7× → Geliştirici seçenekleri  
2. **USB debugging** aç  
3. USB ile Mac’e tak → “Bu bilgisayara güven”  
4. Android Studio (SDK + platform-tools) kurulu olsun (`adb devices` listelesin)

### iPhone
1. Ayarlar → Gizlilik ve Güvenlik → **Geliştirici Modu** aç (yeniden başlat)  
2. USB ile Mac’e tak → Trust  
3. Xcode bir kez aç; Signing için Apple ID (ücretsiz geliştirme imzası yeterli olabilir; App Store dağıtımı için Developer Program gerekir)

---

## 1) Telefona build al (otomatik script)

### Android (önerilen kişisel dogfood)

```bash
cd ~/Desktop/cozbil
bash scripts/phone-dev-build.sh android
```

İlk sefer `prebuild` + Gradle uzun sürer. Bitince telefonda **ÇözBil** ikonu görünür (Expo Go değil).

### iPhone

```bash
cd ~/Desktop/cozbil
bash scripts/phone-dev-build.sh ios
```

Xcode “Signing” sorarsa Team = kendi Apple ID.

---

## 2) Bundan sonra hep aynı build üzerinden güncelle

```bash
cd ~/Desktop/cozbil
git pull   # cloud/PR değişikliklerini al
bash scripts/phone-dev-build.sh metro
```

1. Metro QR / URL gösterir  
2. Telefonda **ÇözBil** (dev client) aç → projeyi seç / otomatik bağlan  
3. Değişiklikler hot reload ile gelir  

Aynı Wi‑Fi yoksa:

```bash
bash scripts/phone-dev-build.sh metro --tunnel
```

Manuel eşdeğer:

```bash
cd apps/mobile
npm start                 # expo start --dev-client
# veya
npm run start:tunnel
```

---

## Ne zaman yeniden native build?

- `expo install` ile **native** modül eklendi/çıkarıldı  
- `app.json` plugin / bundle id / izin metni değişti  
- Expo SDK major upgrade  

O zaman tekrar:

```bash
bash scripts/phone-dev-build.sh android   # veya ios
```

---

## Alternatif: EAS cloud APK (Mac’te Android Studio yoksa)

Expo hesabı + `eas login` gerekir. Detay eski notlar aşağıda; **günlük hızlı döngü için lokal + Metro tercih et.**

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile development
# Link → telefona kur → sonra: npm run start:tunnel
```

iOS EAS için: [`IOS_PHONE_BUILD.md`](./IOS_PHONE_BUILD.md) (Apple Developer + cihaz kaydı).

---

## Bu cloud agent ne yaptı / ne yapamaz?

| Yapıldı (repo) | Yapılamaz (fizik) |
|----------------|-------------------|
| `expo-dev-client` eklendi | Senin USB telefonuna kurulum |
| `scripts/phone-dev-build.sh` | Mac’siz iOS imzalama |
| npm scripts: `start`, `android`, `ios` | EAS login’siz cloud APK |

Sen Mac’te **bölüm 1** komutunu çalıştırınca build telefona iner.

## Profil özeti (`eas.json`)

- `development` — `expo-dev-client` + Android APK (EAS yolu)  
- `preview` — internal APK/IPA  
- `production` — Play AAB  
