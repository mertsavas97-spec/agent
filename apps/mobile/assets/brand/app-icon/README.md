# ÇözBil app icon pack

Source master: `source/cozbil-app-icon-1024.png` (2026-08-01 owl mark).

Regenerate all sizes:

```bash
node scripts/generate-app-icons.mjs apps/mobile/assets/brand/app-icon/source/cozbil-app-icon-1024.png
```

- `iOS/` — AppIcon set + Contents.json  
- `Android/` — mipmap-* + playstore 512  
- Expo: `apps/mobile/assets/images/icon.png` (+ adaptive / splash / favicon / brand-mark)  
- Store marketing: `docs/store/app-icon/`

In-app UI uses `CozbilRobot` → `iOS/icon_180x180.png` (prefetch + `fadeDuration={0}`).

Native home-screen icons require a new native build (`phone-demo-mac.sh ios` / EAS), not Metro alone.
