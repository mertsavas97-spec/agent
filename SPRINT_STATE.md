# Sprint State

**Aktif çalışma yeri:** Cloud agent  
**Branch:** `cursor/solve-word-eq-proxy-6767`  
**Sprint:** **GHA Android AAB (EAS local) + Play photo perms**

## Android build path (bu tur)

- [x] `.easignore` (slim archive)
- [x] `.github/workflows/android-production-aab.yml` (manual)
- [x] `docs/setup/GITHUB_ACTIONS_ANDROID_BUILD.md`
- [ ] Owner: GitHub Secrets (`EXPO_TOKEN` + Firebase public)
- [ ] Owner: Actions → Run **Android production AAB** → Play Internal

## Play Photo & Video policy

- [x] Kod: READ_MEDIA_* blocked + Photo Picker
- [ ] Owner: yeni AAB (GHA) yükle + formda picker yolu

## Store / iOS owner (aynı)

- [ ] Play SKU + billing secret + org policy invoker
- [ ] iOS ASC / secrets / TestFlight
- [ ] Counsel legal
