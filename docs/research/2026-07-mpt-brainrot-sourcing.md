# Brainrot BG sourcing — copyright-safe strategy for MPT

Not legal advice. Goal: multi-channel automation without Content ID / DMCA landmines.

## Do not (high risk)

| Source | Why |
|--------|-----|
| Random Subway Surfers / GTA / Fortnite YouTube rips | Publisher + soundtrack Content ID; “brainrot BG” ≠ fair use |
| “No copyright” videos with unclear license | Claim text ≠ license; often still claimed |
| Scraping ShortGPT-style YouTube URLs in AssetDatabase | License + re-upload rights unverified at scale |
| Game OST left in the BG file | Music claims even when video is “ok” |

Fair use is a **court defense**, not a YouTube switch. Content ID does not evaluate it.

## Preferred stack (safest → ok-with-process)

### Tier A — Own / commissioned (best for scale)

1. **Self-record** gameplay (Minecraft, etc.) on your accounts; export **muted** (strip game audio).
2. **Commission** a creator: written license = commercial, monetized YT/TikTok, sublicense across your channels, no exclusivity required.
3. Store under `storage/brainrot_bg/<pack>/` with `license.json`.

### Tier B — Explicitly licensed packs (buy once)

- Ko-fi / Gumroad “no copyright gameplay” shops that sell **download + commercial/monetize** rights (read the PDF/terms).
- Marketplaces that sell **royalty-free gameplay loops** with invoice.
- Keep receipt + terms PDF next to the pack.

### Tier C — CC BY creator channels (usable, more ops)

Examples of the *category* (always re-check each video description):

- Channels that mark **CC BY 4.0** and allow monetization **with attribution**.
- MPT must auto-append credit to YouTube description, e.g.  
  `Background: [Creator], CC BY 4.0 — [URL]`

Rules: only files you downloaded under that license; never re-upload as “no copyright pack”; mute if any music bed is present.

### Tier D — “Looks like brainrot” without branded game IP (good compromise)

- Stock / CC0 / Pexels-like: driving POV, skate, city timelapse, abstract motion (not “Subway Surfers the game”).
- AI-generated loops **only** if the tool’s ToS allows commercial social + you keep proof.
- Retention mechanic stays; trademark/Content ID risk drops.

### Mojang / Microsoft note

Recording *your own* Minecraft for YouTube is often tolerated under their usage guidelines, but:

- You still need rights to **that recording** (yours or licensed).
- Using someone else’s parkour file without their license is still infringement.
- Mute audio; avoid menu music beds.

Subway Surfers / GTA-style branded footage = treat as **avoid** unless you have a written commercial license from a rights-cleared pack.

## MPT integration (how we pull)

**Not live YouTube scrape.** Local packs only:

```
storage/brainrot_bg/
  minecraft_parkour_v1/
    license.json      # type, licensor, attribution, monetize_ok, source_url, purchased_at
    clip_001.mp4      # muted, 9:16 preferred
    clip_002.mp4
  racing_pov_stock_v1/
    license.json
    ...
```

`license.json` example:

```json
{
  "pack_id": "minecraft_parkour_v1",
  "license": "CC-BY-4.0",
  "monetize_ok": true,
  "attribution_required": true,
  "attribution_text": "Background by GameplaysForFree, CC BY 4.0",
  "source_urls": ["https://youtube.com/watch?v=..."],
  "audio": "stripped",
  "notes": "Do not redistribute as stock"
}
```

WebUI: dropdown = packs where `monetize_ok=true`. Upload flow validates license.json. Render pipeline injects attribution into metadata/description template.

## Operating policy for many channels

1. One curated library (Tier A/B), shared across channels.
2. Rotate clips; don’t use the same 10s loop on 500 uploads (YPP reused-content optics).
3. Never enable “download from YouTube URL” in production without a license gate.
4. If a claim hits: swap pack, don’t dispute fair use as default strategy.

## Recommendation for MPT v1

Ship **local muted packs + license.json + attribution field**.  
Seed library with: (1) self-recorded Minecraft, (2) 1–2 purchased commercial packs, (3) optional stock “motion BG” pack as safe default.  
Defer Subway/GTA-branded assets.


See also: `2026-07-mpt-brainrot-free-bg.md` (Pexels satisfaction default).
