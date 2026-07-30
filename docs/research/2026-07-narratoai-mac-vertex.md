# NarratoAI — Mac Desktop + Vertex (MPT Startup credits)

Local only (no Cursor Remote). Installs to `~/Desktop/NarratoAI`.

## One-shot (Mac Terminal)

```bash
cd ~
git clone https://github.com/mertsavas97-spec/agent.git
cd agent
git fetch origin && git checkout cursor/mpt-vertex-auto-setup-4710

export GOOGLE_CLOUD_PROJECT=mpt-shorts-260727
export GOOGLE_CLOUD_LOCATION=us-central1

bash scripts/narratoai-mac/bootstrap-mac.sh
```

Chrome → **http://127.0.0.1:8501**

## What gets configured

| Item | Value |
|------|--------|
| Path | `~/Desktop/NarratoAI` |
| LLM | Vertex OpenAI-compatible (`google/gemini-2.5-flash`) |
| Auth | ADC (same as MoneyPrinterTurbo) |
| Project | `mpt-shorts-260727` (GFS / Startup billing) |
| TTS | Edge `en-US-JennyNeural` (free; change in UI) |

## Later launches

```bash
cd ~/Desktop/NarratoAI
./open-chrome.sh
```

If you see `Reauthentication is needed`:

```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project mpt-shorts-260727
```

## Note

NarratoAI is a **film commentary / editing** tool (different product from MPT Shorts). It reuses the same Vertex Startup credits for vision + text models.
