# MoneyPrinterTurbo × Google Startup credits (Vertex) — auto setup

**Date:** 2026-07-27  
**MPT path (Cloud VM only):** `/home/ubuntu/MoneyPrinterTurbo` (not inside this repo)

## Goal

Route Gemini through **Vertex AI** so **GFS Cloud Program Start** (~$2k on billing `01F6A9-B52CDE-B4D709`) is used — not AI Studio prepaid (depleted).

## Status: LIVE

| Item | Status |
|------|--------|
| ADC on Cloud VM (`hello@summify.app`) | Done |
| Dedicated project `mpt-shorts-260727` | Created + billing linked |
| `aiplatform.googleapis.com` | Enabled |
| Vertex `generateContent` smoke | PASS (`OK`) |
| MPT `--stop-at script` via Vertex | PASS (HYSA script generated) |
| `gemini_use_vertex=true` in config | Done |

## How to run (VM)

```bash
source /home/ubuntu/MoneyPrinterTurbo/ops/vertex.env
/home/ubuntu/MoneyPrinterTurbo/run.sh cli \
  --video-subject "HYSA tip" --video-language en-US \
  --video-aspect 9:16 --stop-at script
```

## Still needed for full Shorts

(Pexels done.)

- ~~**Pexels** API key~~ — configured; full 9:16 render smoke PASS (~42s HYSA Short)
- YouTube upload OAuth only when upload enabled
- Rotate any AI Studio key previously pasted in chat

## Credits reminder

| Credit | Use for MPT? |
|--------|----------------|
| GFS Cloud Program Start ~$2k | Yes — Vertex on `mpt-shorts-260727` |
| GenAI App Builder (TRY) | No |
| AI Studio prepaid | Exhausted — do not use |
