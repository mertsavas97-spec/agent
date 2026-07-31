# Şahsi telefona ÇözBil demo

**Tarih:** 2026-07-31  
**Branch:** `cursor/scrub-google-api-key-pr31-4710`  
**Neden yeni build?** App Store / TestFlight **build 17** eski (silinmiş) Firebase Browser key ile kırık — auth/solve çalışmaz.

Cloud agent (Linux) **IPA üretemez** ve telefona yükleyemez. Kurulum **Mac + USB** veya **Mac IPA → TestFlight**.

## 0) Bir kez — Firebase `.env.local` (otomatik)

```bash
cd ~/agent
git checkout cursor/scrub-google-api-key-pr31-4710 && git pull
gcloud auth login   # gerekirse bir kez
bash scripts/write-mobile-env-local.sh
```

Key ekrana yazılmaz; dosya gitignore’da — commit etme.

## 1) Backend (solve için zorunlu)

Canlı `ping` şu an **403** olabilir. Mac’te:

```bash
gcloud auth login
gcloud config set project cozbil-dev-f9583
bash scripts/phone-demo-mac.sh fix-backend
# veya: bash scripts/fix-functions-invoker.sh
```

Beklenen: `ping` → HTTP **200**.

## 2A) En hızlı — USB ile şahsi telefon (önerilen demo)

**iPhone:** Ayarlar → Gizlilik → Developer Mode; USB’de “Bu bilgisayara güven”.

```bash
bash scripts/phone-demo-mac.sh ios
# sonraki JS değişiklikleri:
bash scripts/phone-dev-build.sh metro
```

**Android:** USB debugging açık.

```bash
bash scripts/phone-demo-mac.sh android
```

## 2B) TestFlight (mağazaya yakın)

```bash
bash scripts/phone-demo-mac.sh ios --ipa
# → ~/Desktop/cozbil-production.ipa
# Transporter → TestFlight Internal → telefonda yükle
```

GitHub Actions iOS IPA şu an GHA’da **ExpoModulesJSI/SPM** ile sık fail ediyor; şahsi demo için Mac local tercih et.

## 3) Telefonda smoke

1. Onboarding → sınav: **LGS / YGS / KPSS / Ehliyet**  
2. Galeri → `docs/qa/phone-solve-fixtures/` örneklerinden biri  
3. Çöz → cevap + açıklama  
4. (Opsiyonel) çoklu çöz → ödüllü reklam akışı  

**Kullanma:** App Store’daki eski sürüm (build 17).

## Scriptler

| Script | Ne yapar |
|--------|----------|
| `scripts/phone-demo-mac.sh` | Env + opsiyonel backend + USB/IPA |
| `scripts/phone-dev-build.sh` | USB native install / Metro |
| `scripts/mac-build-ipa-with-push.sh` | Production IPA |
| `scripts/fix-functions-invoker.sh` | Callable 403 düzeltmesi |
