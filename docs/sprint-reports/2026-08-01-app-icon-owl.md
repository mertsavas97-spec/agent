# Sprint report — app icon owl refresh

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Yapılanlar

- Yeni owl master → iOS/Android/Expo/store tüm boyutlar (`scripts/generate-app-icons.mjs`)
- Eski flat robot PNG’ler üzerine yazıldı
- `CozbilRobot` + BrandMarkCache prefetch / `fadeDuration={0}` (loading gecikmesi yok)
- iOS `buildNumber` → 3 (native icon bake)

## Owner

```bash
git pull
# Home screen icon için native rebuild şart:
bash scripts/phone-demo-mac.sh ios
# JS-only ekranlar (home/loading) Metro reload yeter:
bash scripts/phone-dev-build.sh metro
```

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** design, mobile, qa  
**Kullanılan skill/agent setleri:** cozbil-team-skills, cozbil-expo-mobile  
**Skill bypass:** yok  
**QA Gate:** icon pack generated / typecheck targeted / guardian PASS  
**Sonraki önerilen adım:** Native rebuild ile launcher icon doğrula  
