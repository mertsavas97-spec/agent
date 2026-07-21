# Login — Mac’ten (telefon linki kırılıyor)

Cloud Agent’daki uzun Google OAuth URL’si telefonda çoğu zaman **açılmaz / kesilir**.

## Yap (Mac, ~2 dk)

```bash
cd ~/Desktop/cozbil   # veya repo klasörün
git fetch origin
git checkout cursor/gcp-startup-live-6767
git pull

# 1) Google Cloud + Firebase login (tarayıcı açılır)
bash scripts/gcp-startup-live-setup.sh --login-only

# 2) API + env + deploy
bash scripts/gcp-startup-live-setup.sh --deploy

# 3) Telefon 403 fix
bash scripts/fix-functions-invoker.sh
```

Login’de **Startup kredili Google hesabını** seç.

## Doğrulama

```bash
curl -s "https://europe-west1-cozbil-dev-f9583.cloudfunctions.net/ping" | python3 -m json.tool
```

Beklenen: `"aiMode": "live"`, `"aiBackend": "vertex"`.

Bitince bu chat’e yaz: **“login+deploy bitti”** — ping sonucunu kontrol ederim.
