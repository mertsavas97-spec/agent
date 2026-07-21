# Sprint Agent Raporu — 2026-07-21 solve pipeline stuck ~90%

**Koordinatör:** Auto  
**İstek:** Loading ~%90’da takılıyor; pipeline çalışmıyor  
**Kullanılan ekipler:** mobile, backend, qa  
**Skill:** `cozbil-expo-mobile`, `cozbil-guardian`, explore analyze  
**Skill bypass:** hayır  

## Kök neden

UI %86–92 = Firestore `pending`/`running` bekleme (cosmetic crawl).  
Asıl sorunlar:

1. Client `PENDING_STUCK_MS=5s` / `SOLVE_TIMEOUT_MS=28s` — live Vertex+Vision için kısa  
2. Storage trigger `cozbilSolve` case-sensitive — GCS lowercase → skip riski  
3. Timeout sonrası callable 403 (org policy) ekstra gecikme  
4. Upload sonrası gereksiz base64 + sıralı UI delay  

## Düzeltmeler

- Path-match Storage trigger: tag opsiyonel; metadata case-insensitive  
- Firestore backup: image yoksa 2.5s retry  
- Vision ADC fetch AbortController 12s  
- Client timeouts 25s pending / 75s hard  
- Trigger fail → skip callable → local fallback  
- Proxy yoksa base64 atla; solve dinlemeyi hemen başlat  
- Progress crawl 55s → %92  

## Owner (Mac — Functions redeploy zorunlu)

```bash
cd ~/Desktop/cozbil
git fetch && git checkout cursor/solve-pipeline-stuck-6767 && git pull
bash scripts/deploy-firestore-solve.sh
```

Telefonda Metro reload (cloud tunnel veya Mac metro).

## QA Gate

- functions: solveUploadMeta + processSolve + build  
- mobile: typecheck / related tests  
- guardian: exam scope değişmedi  

**Sonraki:** Redeploy sonrası telefonda fotoğraf → Firestore `done` + Vertex log
