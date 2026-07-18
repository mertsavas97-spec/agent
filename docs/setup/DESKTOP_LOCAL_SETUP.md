# Masaüstü lokal kurulum — Mac + iOS Simulator

Cloud agent’tan ayrılıp **Mac masaüstünden** devam için.

## 1) Projeyi Desktop’a al

Terminal:

```bash
cd ~/Desktop
git clone https://github.com/mertsavas97-spec/agent.git cozbil
cd cozbil
git checkout cursor/cozbil-polish-capture-loading-9131
```

Cursor → **Open Folder** → `~/Desktop/cozbil`

> Zaten `~/agent` clone’un varsa: Desktop’a taşımak için  
> `mv ~/agent ~/Desktop/cozbil` veya Desktop’ta taze clone.

## 2) Tek komut kurulum

```bash
cd ~/Desktop/cozbil
bash scripts/setup-desktop-macos.sh
```

İlk seferde `.env` boş şablon oluşursa Firebase değerlerini doldurup script’i tekrar çalıştır.

### `apps/mobile/.env` (zorunlu)

Script ilk seferde `.env.example` kopyalar. Firebase Console → `cozbil-dev-f9583` → Project settings → Web app’ten **API_KEY** ve **APP_ID** doldur (diğer alanlar şablonda hazır):

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=<konsoldan>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=cozbil-dev-f9583.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=cozbil-dev-f9583
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=cozbil-dev-f9583.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=717206185063
EXPO_PUBLIC_FIREBASE_APP_ID=<konsoldan>
EXPO_PUBLIC_USE_EMULATORS=0
EXPO_PUBLIC_SCREENSHOT_MODE=0
```

UI-only (Firebase’siz ekran smoke): `EXPO_PUBLIC_SCREENSHOT_MODE=1`

> `.env` git’e girmez. Daha önce chat’te paylaşılmış key varsa Firebase’de rotate et.

## 3) iOS Simulator demo

Önkoşul: **Xcode** + simülatör (Xcode → Settings → Platforms → iOS).

```bash
cd ~/Desktop/cozbil/apps/mobile
npx expo prebuild --platform ios
npx expo run:ios
```

Simülatör seçici çıkarsa bir iPhone simülatörü seç (örn. iPhone 16 / 17).

Sonraki hot reload:

```bash
npx expo start --ios
```

## 4) Fiziksel iPhone (isteğe bağlı)

EAS free iOS kotası doluysa lokal:

```bash
npx expo run:ios --device
```

(USB + Developer Mode + Trust)

## 5) Functions (isteğe bağlı lokal)

```bash
cd ~/Desktop/cozbil/functions
npm run build
# deploy: firebase deploy --only functions --project cozbil-dev-f9583
```

Canlı backend zaten `europe-west1` / Vertex path üzerinde.

## 6) Branch / PR durumu

| Branch | İçerik |
|--------|--------|
| `cursor/cozbil-polish-capture-loading-9131` | **Önerilen** — galeri, progress, tab fix, EAS, profil/US7 üstü |
| `cursor/cozbil-us7-exam-switch-9131` | Sınav seçici + abuse |
| `cursor/cozbil-us6-paywall-9131` | Paywall + ads policy |

Lokal devam için polish branch’i kullan; `main`’e merge sonra `main`’e geç.

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| Sarı bant “Sunucuya ulaşılamadı” / sınav değişmez | Eski build: `git pull` + `npx expo run:ios`. Profil artık Firestore ile açılır. |
| Fotoğraf çözme 401/403 | GCP org policy `allUsers` invoker’ı engelliyor — Cloud Functions çağrılamıyor. Proje sahibinin IAM istisnası vermesi gerekir. |
| Tab’lar yok / takılı | Son commit’te fix var — `git pull` + yeniden `run:ios` |
| Auth AsyncStorage uyarısı | `@react-native-async-storage/async-storage` kurulu olmalı |
| Expo Go uyumsuz | Simulator / `run:ios` kullan (SDK 57) |
| `.env` yok | Yukarıdaki şablon |
| CocoaPods hata | `sudo gem install cocoapods` veya `brew install cocoapods` |
