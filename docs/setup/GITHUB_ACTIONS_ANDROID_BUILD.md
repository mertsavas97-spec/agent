# GitHub Actions — Android production AAB (EAS local)

Mac disk / Expo cloud kota sorununda production AAB’yi **GitHub Actions** runner’ında üret.

Workflow: `.github/workflows/android-production-aab.yml`  
Trigger: **manuel** (`workflow_dispatch`) — her push’ta çalışmaz.

## Owner: secrets (bir kez)

GitHub → repo **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Nereden |
|--------|---------|
| `EXPO_TOKEN` | https://expo.dev/accounts/[account]/settings/access-tokens |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Console web config (EAS production’da zaten var) |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase Console |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | (opsiyonel ama önerilir) |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | (opsiyonel) |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | (opsiyonel) |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | (opsiyonel) |

Android keystore: EAS remote credentials (`eas credentials`) — `EXPO_TOKEN` ile runner çeker. Ayrı keystore secret gerekmez (mevcut Expo setup’ınla aynı).

## Owner: çalıştır

1. Branch’i güncelle (`cursor/solve-word-eq-proxy-6767` veya `main`).
2. GitHub → **Actions** → **Android production AAB** → **Run workflow**.
3. Bitince **Artifacts** → `cozbil-android-production-aab` indir → Play Internal’a yükle.

## Ne yapmaz?

- Expo cloud build kotası kullanmaz (`--local` on runner).
- Mac diskine ihtiyaç duymaz.
- iOS / TestFlight kapsamaz.
- Play’e otomatik submit etmez (ellerle Internal upload).

## Sorun giderme

- `Missing secret` → yukarıdaki secret’ları ekle.
- Gradle fail → Actions log’da `What went wrong` ara; aynı native hata Mac local ile aynı kökten gelir.
- Disk on runner → `.easignore` şişkin klasörleri dışlar; yine fail olursa log + issue aç.
