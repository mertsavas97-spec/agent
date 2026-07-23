# Sprint report — AdMob Kotlin pin for EAS production build

**Tarih:** 2026-07-23  
**Branch:** `cursor/solve-word-eq-proxy-6767`

## Sorun
EAS production Gradle: `:react-native-google-mobile-ads:compileReleaseKotlin`
`play-services-ads-25.4.0` Kotlin metadata **2.3.0**, Expo 57 beklenen **2.1.0**.

## Fix
- `react-native-google-mobile-ads` **16.4.0 → 16.0.0** (googleMobileAds **24.6.0**)
- `app.json` root `android_app_id` / `ios_app_id` (Google test ids; plugin hâlâ env override)

## Sprint Agent Raporu
**Koordinatör:** Auto  
**Ekipler:** Mobile, QA  
**Skill:** cozbil-expo-mobile, cozbil-team-skills  
**QA Gate:** typecheck + targeted Jest (run in commit turn)  
**Sonraki:** Owner `git pull` + `eas build --platform android --profile production`
