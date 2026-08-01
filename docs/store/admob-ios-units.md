# AdMob iOS + Android — ÇözBil unit wiring

**Publisher:** `pub-4628962707131944`  
**Owner teyit:** 2026-08-01 (App ID + Banner / Geçiş / Ödüllü ekran görüntüleri)

## iOS birimleri

| Format | Unit ID |
|--------|---------|
| App ID | `ca-app-pub-4628962707131944~6347757786` |
| Banner | `ca-app-pub-4628962707131944/1521648962` |
| Interstitial | `ca-app-pub-4628962707131944/3447425993` |
| Rewarded | `ca-app-pub-4628962707131944/8645460517` |

## Android birimleri

| Format | Unit ID |
|--------|---------|
| App ID | `ca-app-pub-4628962707131944~2989418548` |
| Banner | `ca-app-pub-4628962707131944/6509861155` |
| Interstitial | `ca-app-pub-4628962707131944/5332510855` |
| Rewarded | `ca-app-pub-4628962707131944/7655421864` |

Kaynak: `eas.json` production env + `COZBIL_*_LIVE_UNITS` in `adUnits.ts` + Mac build scripts.

## Local AAB (1.0.2 / versionCode 18)

```bash
cd ~/agent && git pull
bash scripts/mac-build-aab-local.sh
# → ~/Desktop/cozbil-production.aab
```

## app-ads.txt

```
google.com, pub-4628962707131944, DIRECT, f08c47fec0942fa0
```
