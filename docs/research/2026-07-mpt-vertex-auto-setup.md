# MoneyPrinterTurbo × Google Startup credits (Vertex) — auto setup

**Date:** 2026-07-27  
**MPT path (Cloud VM only):** `/home/ubuntu/MoneyPrinterTurbo` (not inside this repo)

## Goal

Route Gemini calls through **Vertex AI** so **GFS Cloud Program Start** (~$2k on billing `01F6A9-B52CDE-B4D709`) is used — not AI Studio prepaid (already depleted).

## Done on VM (no further human work except Google auth once)

| Item | Status |
|------|--------|
| Clean MPT install (uv, Python 3.11, ffmpeg) | Done |
| EN Shorts defaults (JennyNeural, 9:16) | Done |
| `app/services/gemini_client.py` Vertex/ADC factory | Done |
| `llm.py` + `voice.py` patched to use factory | Done |
| `ops/auto_setup_vertex.sh` (project, APIs, config, smoke) | Done |
| `ops/auth_once.sh` + ADC watcher | Done |
| `ops/pipeline/` daily scaffold + kill switch | Done |
| AI Studio prepaid as primary | Abandoned (429 depleted) |

## Blocked (cannot automate)

Google OAuth / ADC on this Cloud VM requires **one browser approval** on the owner machine (`hello@summify.app`). Password/login in chat is refused.

**Owner action:** run the `gcloud auth application-default login --remote-bootstrap=...` command printed by the agent for the active session, paste the Mac terminal output back into the Cloud chat. Everything after that is scripted.

## After auth (automatic)

1. Link/select GCP project under billing `01F6A9-B52CDE-B4D709`
2. Enable `aiplatform.googleapis.com` (+ generative language)
3. Set `gemini_use_vertex=true` + project/location in `config.toml`
4. Write `ops/vertex.env`
5. Vertex smoke + MPT `--stop-at script`

## Still separate (not Google)

- **Pexels** API key → full video materials
- YouTube upload OAuth → only when upload enabled
- Rotate any AI Studio key that was pasted in chat

## Credits reminder

| Credit | Use for MPT? |
|--------|----------------|
| GFS Cloud Program Start ~$2k | Yes — Vertex Gemini |
| GenAI App Builder (TRY) | No — Agent Builder / Search SKUs only |
| AI Studio prepaid | Exhausted |

## Commands (VM)

```bash
# After ADC exists:
bash /home/ubuntu/MoneyPrinterTurbo/ops/auto_setup_vertex.sh
source /home/ubuntu/MoneyPrinterTurbo/ops/vertex.env
/home/ubuntu/MoneyPrinterTurbo/run.sh cli \
  --video-subject "HYSA tip" --video-language en-US \
  --video-aspect 9:16 --stop-at script
```
