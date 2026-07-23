# Sprint report — Store P0 implement (listing hariç)

**Tarih:** 2026-07-23  
**Branch:** `cursor/solve-word-eq-proxy-6767`

## Yapılanlar

1. **Ads hide:** SDK/unit yokken banner render edilmez; engine `unavailable`; dogfood `ADS_STUB=1` stub kalır; multi/exam-switch `ads_deferred`.
2. **Image picker:** `expo-image-picker` plugin + Android CAMERA / media / POST_NOTIFICATIONS.
3. **IAP UX:** `billingFailureMessage` + `credentials_missing` net Alert (sahte Premium yok).
4. **Terms:** `hosting/public/terms/index.html` + `termsUrl()` + EAS `EXPO_PUBLIC_TERMS_URL`.
5. **EAS:** production Firebase fail-fast in `app.config.js`; `scripts/check-eas-project.sh` + `check-eas-production-env.sh`; docs güncellendi.
6. **Solve guard tests:** production profile proxy yok; `isSolveProxyConfigured` URL/token + `__DEV__` gate.

## Owner kalan

- `eas init` (owner/projectId)
- Hosting deploy (terms + privacy)
- Play SKU + billing SA JSON
- AdMob live SDK/units
- Counsel final

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** Mobile, QA, Guardian  
**Kullanılan skill/agent setleri:** cozbil-team-skills, cozbil-expo-mobile, cozbil-guardian  
**Skill bypass:** Context7 MCP yok (Expo image-picker resmi plugin sözleşmesi)  
**QA Gate:** typecheck / lint / targeted jest / guardian (aşağıda)  
**Sonraki önerilen adım:** Owner `eas init` + hosting deploy; ardından P1 grantRewardedSolve
