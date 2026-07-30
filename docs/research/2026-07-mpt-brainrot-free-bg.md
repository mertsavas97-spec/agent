# Free brainrot BG for MPT (no gamer, no paid packs)

## ShortGPT ne yapıyor?

`AssetDatabase.add_remote_asset(..., youtube_url)` → `yt-dlp` ile indiriyor.  
Lisans kapısı yok: URL ne olursa çekiyor. Bu **ücretsiz görünür ama telif açısından zayıf**; Content ID / DMCA riski sizin omzunuzda.

Biz aynı *mekanizmayı* (remote → cache → loop) kullanabiliriz; varsayılan kaynağı **YouTube rip değil, Pexels** yapıyoruz (key’iniz zaten var, ticari kullanım serbest, attribution zorunlu değil).

## En uygun ücretsiz kurulum (önerilen)

| Öncelik | Kaynak | Ne çeker | Para | Telif |
|---------|--------|----------|------|--------|
| **1 (default)** | **Pexels Video API** | satisfaction / abstract / satisfying loops | 0₺ | Pexels License — monetize OK |
| 2 | Mixkit free | slime, sand, pour (manuel veya scraper-etik) | 0₺ | Mixkit Free License |
| 3 | YouTube **yalnızca** `creativecommons` filter | CC BY parkour vs. | 0₺ | Attribution zorunlu |
| ❌ | Rastgele YT Subway/GTA | — | 0₺ | Yüksek risk |

Oyun şart değil. Retention için motion yeterli: kinetic sand, paint pour, soap cut, resin, hydraulic crush (stock), ink in water, marble run, lathe/wood shaving, etc.

## Pexels query pack’leri (bot dropdown)

```toml
[brainrot.bg]
source = "pexels"          # pexels | mixkit_local | youtube_cc
pack = "satisfaction"      # preset name
mute = true
orientation = "portrait"   # ask portrait when available; else crop center

[brainrot.bg.packs.satisfaction]
queries = [
  "kinetic sand",
  "slime ASMR",
  "paint pouring",
  "soap cutting",
  "satisfying crushing",
  "ink in water",
  "resin art",
  "marble run"
]

[brainrot.bg.packs.abstract]
queries = ["particles background", "smoke dark", "neon lights bokeh", "liquid metal"]

[brainrot.bg.packs.nature_motion]
queries = ["timelapse clouds", "ocean waves aerial", "fireplace close up", "rain window"]

[brainrot.bg.packs. mechanica]  # optional non-game "tech satisfaction"
queries = ["factory machine close up", "printing press", "cnc machine"]
```

Akış: query → Pexels search → cache MP4 → ses strip → süre kadar random trim/loop → fullscreen BG; konu medyası PiP.

## YouTube CC (ShortGPT-benzeri, opsiyonel)

Sadece açılır toggle + zorunlu attribution:

```bash
yt-dlp --match-filter "license*=Creative Commons" ...
```

Whitelist örnek creator’lar (her videoda description tekrar doğrula). Production default **kapalı**.

## Neden bu sizin için en uygun?

- Gamer değilsiniz → self-record yok  
- Para yok → Pexels/Mixkit  
- Çok kanal → aynı free pool, pack’e göre çeşit  
- Satisfaction = klasik brainrot retention, oyun IP’siz  

## Yapılmayacak

ShortGPT gibi açık uçlu `add_remote_asset(any_youtube_url)` production’da.
