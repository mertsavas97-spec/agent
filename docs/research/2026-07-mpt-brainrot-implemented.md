# MPT brainrot mode — implemented

## What shipped

- `render_mode = pexels | brainrot`
- Free BG via **Pexels** packs: `satisfaction`, `abstract`, `nature_motion`, `mechanica`
- Layout: fullscreen muted BG loop + **PiP topic images** (never fullscreen)
- Coverage clamp (`brainrot_overlay_max_coverage`, default 55%)
- WebUI: Render Mode + pack + PiP size/position sliders
- CLI: `--render-mode brainrot --brainrot-bg-pack satisfaction`

## Smoke (2026-07-30)

- 1080×1920, ~11s, PiP coverage ~27%, pack=satisfaction
- Artifact: `/opt/cursor/artifacts/mpt-brainrot-satisfaction-demo.mp4`

## Mac

`scripts/mpt-mac/install.sh` applies brainrot patches after clone.

```bash
./run-local.sh cli --render-mode brainrot --brainrot-bg-pack satisfaction \
  --video-subject "..." --video-language en-US --video-aspect 9:16
```
