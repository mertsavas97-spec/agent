# MPT — Brainrot layout & selectable options

Multi-channel: brainrot is a **render mode**, not a niche. Topic media must never cover the full frame when brainrot BG is on.

## Layer stack (9:16 = 1080×1920)

```
z3  captions (safe zone bottom / center)
z2  topic overlay (image/video PiP)  ← NEVER fullscreen
z1  optional soft vignette / dim
z0  brainrot background loop (fullscreen, muted)
    + voiceover audio + optional BGM
```

ShortGPT reference: top image ~690px max on 1080-wide short ≈ **~64% width**, centered upper half — BG remains visible around it.

## Hard rule

When `render_mode = "brainrot"`:

- Background = 100% frame (cropped/looped gameplay).
- Topic assets = **overlay only**, clamped by `overlay.max_coverage` (default 0.55 of frame area).
- Reject / auto-shrink any asset that would exceed coverage.
- Prefer **images** as overlays; topic **videos** play inside the same PiP box (letterboxed), not as cutaways.

## WebUI / config (selectable)

```toml
[brainrot]
enabled = true
# or render_mode = "pexels" | "brainrot" | "hybrid"

# Background pool (local files; channel can pick a pack)
bg_pack = "minecraft_parkour"          # preset name
bg_directory = "./storage/brainrot_bg/minecraft"
bg_pick = "random"                     # random | sequential | fixed
bg_fixed_file = ""
bg_mute = true
bg_loop = true

# Topic overlay (the “related photos/videos”)
overlay_enabled = true
overlay_media = "images"               # images | images_and_clips | none
overlay_count = 5                      # timed swaps across VO
overlay_max_width_pct = 0.64           # of frame width (≈ ShortGPT 690/1080)
overlay_max_height_pct = 0.42          # of frame height
overlay_max_coverage = 0.55            # area clamp; hard cap
overlay_position = "center_upper"      # center_upper | center | top | custom
overlay_margin_top_pct = 0.12
overlay_margin_side_pct = 0.08
overlay_radius_px = 24                 # rounded card
overlay_shadow = true
overlay_padding_pct = 0.02             # inner pad so card ≠ edge-to-edge
overlay_dim_bg = 0.15                  # slight darken under card only (optional)

# Captions stay outside / below card
caption_safe_zone = "below_overlay"    # below_overlay | bottom | center

# Source for overlay stills/clips (topic-related)
overlay_source = "pexels_images"       # pexels_images | bing | local
```

## Presets (one-click on bot)

| Preset | BG pack | Overlay size | Notes |
|--------|---------|--------------|-------|
| `brainrot_classic` | minecraft | 64% × 42% | facts / reddit style |
| `brainrot_racing` | car_cam | 60% × 40% | same layout |
| `brainrot_subway` | subway_surfers | 64% × 42% | |
| `brainrot_minimal` | any | 50% × 35% | more BG visible |
| `pexels_cutaway` | — | fullscreen cuts | current MPT (brainrot off) |

## Why not fullscreen topic video

Fullscreen topic clips **replace** the brainrot layer → mode collapses to normal MPT.  
So in brainrot mode: topic video = **PiP only**; if user wants full B-roll, they switch `render_mode = pexels`.

## Hybrid (optional later)

`hybrid`: 70% time brainrot+overlay, occasional 1–2s full topic punch-in — separate toggle, default off.

## Implementation sketch (MPT)

1. New section in WebUI: **Render mode** + **Brainrot** panel (sliders for width/height %).
2. Live preview mock: 9:16 wireframe showing BG + overlay box + caption zone.
3. Compose path: keep TTS/SRT; replace `combine_videos` fullscreen concat with:
   - trim/loop BG to audio duration
   - timed ImageClip/VideoClip overlays with size/position from config
   - burn captions in safe zone
4. Asset packs: `storage/brainrot_bg/<pack>/*.mp4` + dropdown of pack names.

## Acceptance

- With brainrot on, at every frame ≥ ~30% of pixels show BG (outside overlay+captions).
- Overlay never exceeds `overlay_max_coverage`.
- Switching preset changes pack + size without code edit.
