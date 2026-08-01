# Sprint — Android AAB prep (1.0.2 / versionCode 18)

**Tarih:** 2026-08-01  
**Branch:** `cursor/home-polish-yks-ads-ocr-2914`

## Hazırlık

- `app.json`: version **1.0.2**, android `versionCode` **18** (Play max 5’ten büyük)
- `eas.json`: `appVersionSource: local` (sürüm app.json’dan)
- Ads: platforma özel unit kontrolü (iOS id → Android’de live sayılmaz)
- Scripts: `mac-build-aab-local.sh` + `build-android-aab-local.sh`

## Owner Mac

```bash
cd ~/agent && git pull
bash scripts/mac-build-aab-local.sh
# → ~/Desktop/cozbil-production.aab
```

Play: Kapalı test → alpha → yükle. 14 gün sıfırlanmaz.

## Not

Android AdMob birimleri henüz yoksa AAB alınır; reklam Android’de kapalı.
Çözüm pipeline aynı (Functions / Vertex).
