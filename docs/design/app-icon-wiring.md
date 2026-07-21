# App icon wiring — ÇözBil

**Source zip:** `~/Desktop/CozBil_AppIcon_iOS_Android.zip`  
**Pack mirror:** `apps/mobile/assets/brand/app-icon/` (iOS + Android mipmaps + playstore)

## Expo / EAS

| File | Role |
|------|------|
| `assets/images/icon.png` | iOS + default (1024) |
| `assets/images/android-icon-foreground.png` | Adaptive foreground |
| `assets/images/android-icon-background.png` | Solid navy `#1E1B4B` |
| `assets/images/android-icon-monochrome.png` | Themed icon |
| `assets/images/splash-icon.png` | Splash |
| `assets/images/favicon.png` | Web |
| `assets/images/brand-mark.png` | In-app `CozbilRobot` |

## Native iOS

`ios/zBil/Images.xcassets/AppIcon.appiconset` — full size set + Contents.json + marketing 1024.

## In-app

`CozbilRobot` renders `brand-mark.png` (onboarding, home, bootstrap, analyzing, paywall, profile, settings).

## Play Console

Upload `docs/store/app-icon/playstore-512.png` (or 512 from pack) as high-res icon if asked.

**Note:** Home screen icon change requires a **native rebuild** (dev-client / EAS), not Metro reload alone.
