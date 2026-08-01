# AdMob iOS — ÇözBil unit wiring

**Publisher:** `pub-4628962707131944`  
**Kaynak:** AdMob → ÇözBil iOS → Reklam birimleri  
**Owner teyit:** 2026-08-01 (App ID + Banner / Geçiş / Ödüllü ekran görüntüleri)

## Birimler (eas.json production)

| Format | AdMob adı | Unit ID |
|--------|-----------|---------|
| Banner | Banner | `ca-app-pub-4628962707131944/1521648962` |
| Interstitial | Geçiş | `ca-app-pub-4628962707131944/3447425993` |
| Rewarded | Ödüllü | `ca-app-pub-4628962707131944/8645460517` |

Env keys: `EXPO_PUBLIC_ADMOB_BANNER_IOS` / `_INTERSTITIAL_IOS` / `_REWARDED_IOS`.

## Zorunlu: Uygulama kimliği (App ID)

```
ca-app-pub-4628962707131944~6347757786
```

`eas.json` production + Mac script varsayılanında gömülü.

## Mac IPA (birimler + push branch)

```bash
cd ~/agent
git fetch origin && git checkout cursor/admob-ios-units-2914 && git pull

export EXPO_PUBLIC_FIREBASE_API_KEY='…'
export EXPO_PUBLIC_FIREBASE_APP_ID='…'
# AdMob App ID + units eas.json / script varsayılanından gelir

bash scripts/mac-build-ipa-with-push.sh
```

## Android

Henüz birim yok. Ayrı Android app + 3 birim sonra `EXPO_PUBLIC_ADMOB_*_ANDROID` eklenir.

## app-ads.txt

Marketing / developer website’te `app-ads.txt` satırı:

```
google.com, pub-4628962707131944, DIRECT, f08c47fec0942fa0
```

Örn. `https://mertsavas97-spec.github.io/app-ads.txt` canlıysa ASC Marketing URL bu domain köküyle uyumlu olmalı.
