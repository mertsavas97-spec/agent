# MoneyPrinterTurbo — Mac local (önerilen)

Cloud VM WebUI Mac’ten doğrudan açılmaz. **Local Mac** = doğru kullanım.

## Tek seferlik kurulum

Repo’dan (bu branch pull sonrası):

```bash
cd ~/Desktop   # veya istediğiniz yer
# scripts bu repoda: agent/scripts/mpt-mac/
git clone https://github.com/mertsavas97-spec/agent.git
cd agent
git checkout cursor/mpt-vertex-auto-setup-4710

export PEXELS_API_KEY='YOUR_PEXELS_KEY'
export GOOGLE_CLOUD_PROJECT=mpt-shorts-260727
export GOOGLE_CLOUD_LOCATION=us-central1

bash scripts/mpt-mac/install.sh
```

ADC (bir kez; daha önce yaptıysanız atlayın):

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project mpt-shorts-260727
```

## Her açılışta

```bash
cd ~/MoneyPrinterTurbo
source vertex.env
./run-local.sh webui
```

Tarayıcı: **http://127.0.0.1:8501**

CLI:

```bash
./run-local.sh cli \
  --video-subject "One HYSA tip" \
  --video-language en-US \
  --video-aspect 9:16
```

## Ne gelir hazır?

- Vertex Gemini (`mpt-shorts-260727`) — Startup kredisi
- Edge TTS JennyNeural — key yok
- Edge subtitles — key yok
- Pexels — `PEXELS_API_KEY` ile

## Güvenlik

Key’leri chat’e yapıştırmayın; Mac’te env / `config.toml` (gitignore) kullanın.


**Güncel:** Remote yok — bkz. `2026-07-mpt-mac-chrome-local.md` + `scripts/mpt-mac/bootstrap-mac.sh`.
