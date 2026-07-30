# MoneyPrinterTurbo — Mac local + Chrome (no Remote Control)

Cloud VM Remote Control **kullanılmaz**. Bot Mac’te çalışır; Chrome `http://127.0.0.1:8501` açar.

## Tek sefer

```bash
# 1) Bu repo (brainrot + Vertex patch kit)
cd ~
git clone https://github.com/mertsavas97-spec/agent.git
cd agent
git fetch origin && git checkout cursor/mpt-vertex-auto-setup-4710

# 2) Pexels key (chat’e yapıştırmayın)
export PEXELS_API_KEY='YOUR_PEXELS_KEY'
export GOOGLE_CLOUD_PROJECT=mpt-shorts-260727
export GOOGLE_CLOUD_LOCATION=us-central1

# 3) Kur + Chrome’da aç
bash scripts/mpt-mac/bootstrap-mac.sh
```

Chrome otomatik açılır: **http://127.0.0.1:8501**

## Sonraki açılışlar

```bash
cd ~/MoneyPrinterTurbo
./open-chrome.sh
```

## Vertex (script üretimi)

Bir kez Mac’te:

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project mpt-shorts-260727
```

Edge TTS + Pexels brainrot BG için Vertex şart değil; LLM script için gerekir.

## WebUI

**Render Mode → Brainrot** → pack `Satisfaction` (ücretsiz Pexels).
