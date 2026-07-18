# iPhone’a ÇözBil kur (Expo Go değil)

Mağaza Expo Go, SDK 57 ile uyumsuz olabilir. iPhone’da **kendi .ipa build’in** gerekir.

## Gerekenler (zorunlu)

1. **Expo hesabı** — [expo.dev](https://expo.dev) (ücretsiz)
2. **Apple Developer Program** — [developer.apple.com](https://developer.apple.com) (~$99/yıl)  
   iOS’a telefona kurulabilir build almak için şart (Android APK gibi “ücretsiz yan yükleme” yok).

## İki yol

### A) Ad hoc (hızlı, kişisel cihaz)

Sadece kayıtlı iPhone’lara kurulum.

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build:configure   # projectId bağla
npx eas-cli@latest device:create     # iPhone UDID kaydı (QR ile)
npx eas-cli@latest build --platform ios --profile preview
```

Bitince EAS sayfasındaki **Install** linkini iPhone Safari’de aç → profil / uygulama kur.

> Yeni cihaz ekledikten sonra çoğu zaman **yeniden build** gerekir (provisioning listesi).

### B) TestFlight (daha rahat paylaşım)

```bash
cd apps/mobile
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

Sonra TestFlight uygulamasından yükle.

## Bu agent’ta ne eksik?

- Expo login yok → `EXPO_TOKEN` veya senin makinede `eas login`
- Apple hesabı / Team ID agent’ta yok → ilk `eas build -p ios` sırasında senin etkileşimli Apple girişi gerekir

## Agent’a devam ettirmek için

Şunları yaz / ver:

1. Expo: `eas login` yaptın mı? (veya `EXPO_TOKEN`)
2. Apple Developer aktif mi? (Team adı / ID yeterli, şifre chat’e yapıştırma)
3. iPhone’u `eas device:create` ile kaydettin mi?

Sonra burada:

```bash
cd apps/mobile && npx eas-cli@latest build --platform ios --profile preview --non-interactive
```

çalıştırılabilir (credentials EAS’ta kayıtlıysa).

## Profil

`eas.json` → `preview` → `"distribution": "internal"` (iOS ad hoc).
