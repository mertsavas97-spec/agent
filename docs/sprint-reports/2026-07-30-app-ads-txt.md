# Sprint report — 2026-07-30 — AdMob app-ads.txt

## Özet

AdMob iOS doğrulaması `app-ads.txt` 404 yüzünden düşüyordu. Dosya Hosting köküne eklendi; Content-Type + check/deploy runbook güncellendi. Banner / interstitial / rewarded kod wiring mevcut; canlı id’ler EAS secret (owner).

## Değişiklikler

- `hosting/public/app-ads.txt` — AdMob satırı `pub-4628962707131944`
- `firebase.json` — `/app-ads.txt` → `text/plain; charset=utf-8`
- `scripts/check-app-ads-txt.sh` + deploy smoke
- Docs: `docs/store/app-ads-txt.md`, hosting/IAP readiness/owner ops
- Test: `apps/mobile/tests/appAdsTxt.test.ts`

## Owner kalan

1. `bash scripts/deploy-hosting-legal.sh`
2. ASC/Play developer website = `https://cozbil-dev-f9583.web.app`
3. AdMob crawl / “güncellemeleri kontrol et”
4. EAS `EXPO_PUBLIC_ADMOB_*` production secrets

---

## Sprint Agent Raporu

**Koordinatör:** Auto (ÇözBil)
**Kullanılan ekipler:** mobile, qa, guardian
**Kullanılan skill/agent setleri:** `cozbil-team-skills`, `cozbil-guardian` (exam/copy drift yok)
**Skill bypass:** Spec Kit (sadece hosting/AdMob ops; yeni ürün scope yok)
**QA Gate:** typecheck PASS / lint PASS / smoke local app-ads PASS / live app-ads 404 (owner deploy) / guardian PASS (scope drift yok)
**Sonraki önerilen adım:** Owner Hosting deploy + AdMob re-crawl; EAS AdMob unit secrets
