# Sprint report — Owner preflight helpers + lint clean

**Tarih:** 2026-07-23  
**Branch:** `cursor/solve-word-eq-proxy-6767`

## Yapılanlar

1. ESLint 2 warning temizlendi (`index.tsx` examType; `solve-batch` ref cleanup) → `--max-warnings 0`
2. `firebase.json` `/terms` rewrite + hosting root index (privacy + terms link)
3. `scripts/check-store-preflight.sh` (+ `npm run store:preflight`)
4. `scripts/deploy-store-functions.sh` (grant / purge / sync)
5. `scripts/deploy-hosting-legal.sh`
6. Owner ops + hosting runbook güncellendi

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** Mobile, QA, Guardian, Release  
**Skill/agent setleri:** cozbil-team-skills, cozbil-expo-mobile, cozbil-guardian  
**Skill bypass:** Context7 (deploy script only)  
**QA Gate:**
- typecheck: PASS
- lint: PASS (0 errors / 0 warnings)
- smoke: `check-store-preflight` PASS (1 WARN: eas projectId) + Jest mobile 261 / functions 90
- guardian: PASS (neutral hosting copy; no overclaim)

**Sonraki:** Owner Sprint A — `docs/store/OWNER_OPS_STORE_READY.md`
