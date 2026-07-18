# Telefona native build (Expo Go yok)

Mağazadaki Expo Go, projedeki **SDK 57** ile uyumsuz olabilir.
Çözüm: **EAS Build** ile kendi APK / IPA’nı üretip telefona kurmak.

## Hangisi senin telefonun?

| Platform | En kolay yol | Gereken |
|----------|--------------|---------|
| **Android** | `preview` profil → **APK** indir, kur | Ücretsiz Expo hesabı (Play hesabı şart değil) |
| **iOS** | Internal / TestFlight | **Apple Developer** ($99/yıl) + Expo hesabı |

## 1) Expo’ya giriş (bir kez)

Bilgisayarında veya Cursor’da:

```bash
cd apps/mobile
npx eas-cli@latest login
# veya CI için: export EXPO_TOKEN=...
```

## 2) Projeyi EAS’a bağla

```bash
cd apps/mobile
npx eas-cli@latest build:configure
# “existing project” / yeni oluştur → slug: cozbil
```

`app.json` içine `extra.eas.projectId` yazılır.

## 3) Android APK (kişisel telefon — önerilen)

```bash
cd apps/mobile
npx eas-cli@latest build --platform android --profile preview
```

- İlk seferde keystore’u EAS’ın üretmesine izin ver.
- Bitince link gelir → telefonda aç → **Install**.
- “Bilinmeyen kaynaklardan kurulum” izni gerekebilir.

## 4) iOS (kişisel iPhone)

```bash
npx eas-cli@latest build --platform ios --profile preview
```

Apple hesabı + cihaz UDID / ad-hoc veya TestFlight gerekir.
Alternatif: `eas submit` → TestFlight.

## 5) Geliştirme build (hot reload istersek)

```bash
npx expo install expo-dev-client
npx eas-cli@latest build --platform android --profile development
```

Sonra Metro: `npx expo start --dev-client --tunnel`

## Bu cloud agent’ta neden şimdi bitmiyor?

Agent ortamında **Expo login yok** (`eas whoami` → Not logged in).
Sen `eas login` yaptıktan sonra (veya `EXPO_TOKEN` verirsen) aynı komutları burada da çalıştırabiliriz.

## Profil özeti (`eas.json`)

- `preview` — telefona kurulan APK (internal)
- `development` — `expo-dev-client` ile geliştirme
- `production` — Play AAB
