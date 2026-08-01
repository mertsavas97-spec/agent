# Sprint State

**Branch:** `cursor/home-polish-yks-ads-ocr-2914`  
**iOS:** 1.0.2 (18) — TestFlight  
**Android:** 1.0.2 / versionCode **20** — kapalı test AAB (AdMob wired)

## Android AAB — GHA (önerilen)

Mac disk yetmezse veya Gradle Plugin Portal flaky ise:

1. https://github.com/mertsavas97-spec/agent/actions/workflows/android-production-aab.yml  
2. **Run workflow** → branch: `cursor/home-polish-yks-ads-ocr-2914`  
3. Bitince artifact: `cozbil-android-production-aab` indir  
4. Play → Kapalı test (alpha) → Yeni sürüm → AAB yükle  

**2026-08-01 fix:** RN `foojay-resolver-convention` strip (`eas-build-post-install`)
— GHA’da “Plugin was not found” hatasını önler. JDK 17 zaten workflow’da.

(Secrets: `EXPO_TOKEN`, Firebase public keys — daha önce kurulduysa tekrar gerekmez.)

## Android AAB — Mac yer açtıysan (~15+ GiB boş)

```bash
# temizlik
rm -rf ~/eas-local-build ~/.gradle/caches
rm -rf ~/Library/Developer/Xcode/DerivedData
df -h /System/Volumes/Data   # Avail ≥ 15G olmalı

cd ~/agent && git pull
bash scripts/mac-build-aab-local.sh
# → ~/Desktop/cozbil-production.aab
```

Script: disk gate + `eas-local-build` temizliği + yalnız **arm64** + foojay patch.

## iOS IPA (hatırlatma)

```bash
bash scripts/mac-build-ipa-with-push.sh
```
