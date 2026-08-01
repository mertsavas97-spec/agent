# Sprint report — 2026-08-01 Android AAB disk / arm64 local build

## Özet

Owner Mac yerel AAB iki kez başarısız:

1. **No space left on device** (~2,5 GiB boş) — Gradle CMake aşamasında disk doldu.
2. Temizlik sonrası ikinci deneme neredeyse bitti; **ABORT** + yarım CMake / rnscreens header (kesinti / OOM / disk baskısı). `autoIncrement` yerel `versionCode`’u 19→20 yaptı.

## Yapılanlar

- `scripts/build-android-aab-local.sh`: min ~12 GiB disk gate, `~/eas-local-build` temizliği, `reactNativeArchitectures=arm64-v8a`, Gradle Metaspace/heap ayarı, GHA fallback mesajı.
- `scripts/mac-build-aab-local.sh`: disk/GHA notu.
- `apps/mobile/app.json` `versionCode` → **20** (Mac’teki son bump ile hizalı).
- `SPRINT_STATE.md`: GHA AAB birincil yol; Mac ikinci.

## Owner sonraki adım

1. Tercihen **GitHub Actions → Android production AAB**.
2. Ya da Mac’te 15+ GiB boşalt → `bash scripts/mac-build-aab-local.sh`.
3. AAB’yi Play kapalı test (alpha) yükle; 12 tester kalsın.

## Sprint Agent Raporu

**Koordinatör:** Auto (Composer)  
**Kullanılan ekipler:** mobile (executor), QA  
**Kullanılan skill/agent setleri:** `cozbil-team-skills`, `cozbil-expo-mobile`, `cozbil-guardian`  
**Skill bypass:** Spec Kit (release ops / build script only)  
**QA Gate:** typecheck / lint / smoke (scripts + version sync) / guardian PASS  
**Sonraki önerilen adım:** GHA veya disk-açık Mac’ten AAB → Play kapalı test
