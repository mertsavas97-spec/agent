"""Brainrot render mode: muted looping BG + timed PiP topic overlays.

Free default BG source is Pexels (satisfaction / abstract / nature packs).
Topic media is never fullscreen so the BG stays visible.
"""

from __future__ import annotations

import math
import os
import random
from dataclasses import dataclass, field
from typing import List, Optional
from urllib.parse import urlencode

import requests
from loguru import logger
from moviepy import (
    AudioFileClip,
    CompositeVideoClip,
    ImageClip,
    VideoFileClip,
    concatenate_videoclips,
)
from moviepy.video.fx.Loop import Loop

from app.config import config
from app.models.schema import MaterialInfo, VideoAspect, VideoParams
from app.services import material as material_service
from app.utils import utils

# Preset query packs — free Pexels, no game IP required.
BRAINROT_BG_PACKS: dict[str, list[str]] = {
    "satisfaction": [
        "kinetic sand",
        "slime satisfying",
        "paint pouring",
        "soap cutting",
        "ink in water",
        "resin art",
        "marble run",
        "satisfying crush",
    ],
    "abstract": [
        "particles background",
        "smoke dark abstract",
        "neon lights bokeh",
        "liquid metal",
        "color ink water",
    ],
    "nature_motion": [
        "ocean waves aerial",
        "timelapse clouds",
        "fireplace close up",
        "rain on window",
        "waterfall close up",
    ],
    "mechanica": [
        "factory machine close up",
        "cnc machine",
        "printing press",
        "gears close up",
    ],
}


@dataclass
class BrainrotMaterials:
    background_path: str
    overlay_paths: List[str] = field(default_factory=list)
    bg_pack: str = "satisfaction"
    bg_query: str = ""


def get_brainrot_setting(params: VideoParams, key: str, default):
    """Prefer VideoParams field, else config.app."""
    value = getattr(params, key, None)
    if value is not None and value != "":
        return value
    return config.app.get(key, default)


def list_bg_packs() -> list[str]:
    return sorted(BRAINROT_BG_PACKS.keys())


def _clamp_overlay_size(
    frame_w: int,
    frame_h: int,
    width_pct: float,
    height_pct: float,
    max_coverage: float,
) -> tuple[int, int]:
    width_pct = max(0.2, min(float(width_pct), 0.85))
    height_pct = max(0.15, min(float(height_pct), 0.7))
    max_coverage = max(0.15, min(float(max_coverage), 0.75))

    ow = int(frame_w * width_pct)
    oh = int(frame_h * height_pct)
    area = ow * oh
    limit = frame_w * frame_h * max_coverage
    if area > limit and area > 0:
        scale = math.sqrt(limit / area)
        ow = max(1, int(ow * scale))
        oh = max(1, int(oh * scale))
    return ow, oh


def _overlay_position(
    frame_w: int,
    frame_h: int,
    ow: int,
    oh: int,
    position: str,
    margin_top_pct: float,
) -> tuple:
    position = (position or "center_upper").strip().lower()
    margin_top = int(frame_h * max(0.0, min(float(margin_top_pct), 0.4)))
    side = max(0, (frame_w - ow) // 2)

    if position == "center":
        return ("center", "center")
    if position == "top":
        return (side, margin_top)
    # center_upper (default): horizontally centered, upper band
    return (side, margin_top)


def search_videos_pexels_flexible(
    search_term: str,
    minimum_duration: int = 5,
    video_aspect: VideoAspect = VideoAspect.portrait,
    prefer_portrait: bool = True,
) -> List[MaterialInfo]:
    """Pexels video search without requiring exact 1080x1920 rendition."""
    aspect = VideoAspect(video_aspect)
    api_key = material_service.get_api_key("pexels_api_keys")
    headers = {
        "Authorization": api_key,
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        ),
    }
    orientation = "portrait" if prefer_portrait else aspect.name
    params = {"query": search_term, "per_page": 20, "orientation": orientation}
    query_url = f"https://api.pexels.com/v1/videos/search?{urlencode(params)}"
    logger.info(f"brainrot BG search pexels: term={search_term!r}")

    try:
        r = requests.get(
            query_url,
            headers=headers,
            proxies=config.proxy,
            verify=material_service._get_tls_verify(),
            timeout=(30, 60),
        )
        response = r.json()
        items: List[MaterialInfo] = []
        for v in response.get("videos") or []:
            duration = int(v.get("duration") or 0)
            if duration < minimum_duration:
                continue
            files = list(v.get("video_files") or [])
            # Prefer portrait-ish, then largest area
            def score(f):
                w = int(f.get("width") or 0)
                h = int(f.get("height") or 0)
                portrait_bonus = 10_000_000 if h >= w else 0
                return portrait_bonus + w * h

            files.sort(key=score, reverse=True)
            best = next((f for f in files if f.get("link")), None)
            if not best:
                continue
            item = MaterialInfo()
            item.provider = "pexels"
            item.url = best["link"]
            item.duration = duration
            item.source_info = {
                "provider": "pexels",
                "search_term": search_term,
                "asset_id": str(v.get("id")) if v.get("id") is not None else None,
                "kind": "brainrot_bg",
            }
            items.append(item)
        return items
    except Exception as e:
        logger.error(f"brainrot BG search failed: {type(e).__name__}: {e}")
        return []


def search_images_pexels(search_term: str, per_page: int = 12) -> List[MaterialInfo]:
    """Pexels photo search for PiP topic overlays."""
    api_key = material_service.get_api_key("pexels_api_keys")
    headers = {
        "Authorization": api_key,
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        ),
    }
    params = {"query": search_term, "per_page": per_page, "orientation": "portrait"}
    query_url = f"https://api.pexels.com/v1/search?{urlencode(params)}"
    logger.info(f"brainrot overlay image search: term={search_term!r}")

    try:
        r = requests.get(
            query_url,
            headers=headers,
            proxies=config.proxy,
            verify=material_service._get_tls_verify(),
            timeout=(30, 60),
        )
        response = r.json()
        items: List[MaterialInfo] = []
        for photo in response.get("photos") or []:
            src = photo.get("src") or {}
            url = src.get("large2x") or src.get("large") or src.get("original")
            if not url:
                continue
            item = MaterialInfo()
            item.provider = "pexels"
            item.url = url
            item.duration = 0
            item.source_info = {
                "provider": "pexels",
                "search_term": search_term,
                "asset_id": str(photo.get("id")) if photo.get("id") is not None else None,
                "kind": "brainrot_overlay",
            }
            items.append(item)
        return items
    except Exception as e:
        logger.error(f"brainrot image search failed: {type(e).__name__}: {e}")
        return []


def _download_url(url: str, dest_path: str) -> str:
    os.makedirs(os.path.dirname(dest_path) or ".", exist_ok=True)
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
        return dest_path
    r = requests.get(
        url,
        stream=True,
        proxies=config.proxy,
        verify=material_service._get_tls_verify(),
        timeout=(30, 120),
    )
    r.raise_for_status()
    with open(dest_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=1024 * 256):
            if chunk:
                f.write(chunk)
    return dest_path


def prepare_brainrot_materials(
    task_id: str,
    params: VideoParams,
    video_terms: list,
    audio_duration: float,
) -> Optional[BrainrotMaterials]:
    pack = str(get_brainrot_setting(params, "brainrot_bg_pack", "satisfaction"))
    queries = list(BRAINROT_BG_PACKS.get(pack) or BRAINROT_BG_PACKS["satisfaction"])
    random.shuffle(queries)

    cache_dir = os.path.join(utils.storage_dir(), "brainrot_bg", pack)
    os.makedirs(cache_dir, exist_ok=True)
    task_dir = utils.task_dir(task_id)

    bg_path = ""
    used_query = ""
    min_dur = max(8, int(min(audio_duration, 20)) if audio_duration else 8)

    for query in queries:
        items = search_videos_pexels_flexible(
            search_term=query,
            minimum_duration=min(min_dur, 5),
            video_aspect=params.video_aspect or VideoAspect.portrait,
            prefer_portrait=True,
        )
        if not items:
            # retry without min duration floor
            items = search_videos_pexels_flexible(
                search_term=query,
                minimum_duration=3,
                prefer_portrait=True,
            )
        if not items:
            continue
        item = random.choice(items[:5])
        asset_id = (item.source_info or {}).get("asset_id") or "x"
        dest = os.path.join(cache_dir, f"bg-{asset_id}.mp4")
        try:
            _download_url(item.url, dest)
            bg_path = dest
            used_query = query
            break
        except Exception as e:
            logger.warning(f"brainrot BG download failed: {e}")
            continue

    if not bg_path:
        logger.error("brainrot: no background video could be downloaded from Pexels")
        return None

    # Topic overlays: images from script terms (PiP, never fullscreen)
    overlay_count = int(get_brainrot_setting(params, "brainrot_overlay_count", 5) or 5)
    overlay_count = max(0, min(overlay_count, 12))
    terms = [str(t).strip() for t in (video_terms or []) if str(t).strip()]
    if not terms and params.video_subject:
        terms = [params.video_subject]

    overlay_paths: List[str] = []
    overlay_dir = os.path.join(task_dir, "brainrot_overlays")
    os.makedirs(overlay_dir, exist_ok=True)

    for term in terms:
        if len(overlay_paths) >= overlay_count:
            break
        photos = search_images_pexels(term, per_page=8)
        for photo in photos:
            if len(overlay_paths) >= overlay_count:
                break
            asset_id = (photo.source_info or {}).get("asset_id") or f"{len(overlay_paths)}"
            ext = ".jpg"
            dest = os.path.join(overlay_dir, f"ov-{asset_id}{ext}")
            try:
                _download_url(photo.url, dest)
                overlay_paths.append(dest)
            except Exception as e:
                logger.warning(f"overlay download failed: {e}")

    logger.info(
        f"brainrot materials ready: pack={pack}, query={used_query!r}, "
        f"bg={bg_path}, overlays={len(overlay_paths)}"
    )
    return BrainrotMaterials(
        background_path=bg_path,
        overlay_paths=overlay_paths,
        bg_pack=pack,
        bg_query=used_query,
    )


def _fit_cover(clip, target_w: int, target_h: int):
    """Scale clip to cover target canvas, then center-crop."""
    w, h = clip.size
    if w <= 0 or h <= 0:
        return clip.resized((target_w, target_h))
    scale = max(target_w / w, target_h / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = clip.resized((nw, nh))
    x1 = max(0, (nw - target_w) // 2)
    y1 = max(0, (nh - target_h) // 2)
    return resized.cropped(x1=x1, y1=y1, x2=x1 + target_w, y2=y1 + target_h)


def _fit_contain(clip, box_w: int, box_h: int):
    """Scale clip to fit inside box (letterbox inside PiP)."""
    w, h = clip.size
    if w <= 0 or h <= 0:
        return clip.resized((box_w, box_h))
    scale = min(box_w / w, box_h / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    return clip.resized((nw, nh))


def combine_brainrot_video(
    combined_video_path: str,
    materials: BrainrotMaterials,
    audio_file: str,
    params: VideoParams,
    threads: int = 2,
) -> str:
    """Fullscreen muted BG loop + timed PiP overlays (never fullscreen topic)."""
    audio_clip = AudioFileClip(audio_file)
    try:
        audio_duration = float(audio_clip.duration)
    finally:
        audio_clip.close()

    aspect = VideoAspect(params.video_aspect or VideoAspect.portrait)
    frame_w, frame_h = aspect.to_resolution()

    width_pct = float(
        get_brainrot_setting(params, "brainrot_overlay_max_width_pct", 0.64)
    )
    height_pct = float(
        get_brainrot_setting(params, "brainrot_overlay_max_height_pct", 0.42)
    )
    max_coverage = float(
        get_brainrot_setting(params, "brainrot_overlay_max_coverage", 0.55)
    )
    position = str(
        get_brainrot_setting(params, "brainrot_overlay_position", "center_upper")
    )
    margin_top_pct = float(
        get_brainrot_setting(params, "brainrot_overlay_margin_top_pct", 0.12)
    )

    ow, oh = _clamp_overlay_size(
        frame_w, frame_h, width_pct, height_pct, max_coverage
    )
    pos = _overlay_position(frame_w, frame_h, ow, oh, position, margin_top_pct)
    coverage = (ow * oh) / float(frame_w * frame_h)
    logger.info(
        f"brainrot layout: canvas={frame_w}x{frame_h}, pip={ow}x{oh}, "
        f"coverage={coverage:.2%}, pos={pos}"
    )

    bg = VideoFileClip(materials.background_path, audio=False)
    try:
        bg = _fit_cover(bg, frame_w, frame_h)
        if bg.duration < audio_duration:
            bg = bg.with_effects([Loop(duration=audio_duration)])
        else:
            # random-ish start trim when longer than needed
            max_start = max(0.0, bg.duration - audio_duration)
            start = random.uniform(0, max_start) if max_start > 0.5 else 0.0
            bg = bg.subclipped(start, start + audio_duration)
        bg = bg.with_duration(audio_duration)

        layers = [bg]
        overlays = list(materials.overlay_paths or [])
        if overlays:
            slot = audio_duration / len(overlays)
            for i, path in enumerate(overlays):
                t0 = i * slot
                t1 = audio_duration if i == len(overlays) - 1 else (i + 1) * slot
                dur = max(0.4, t1 - t0)
                try:
                    img = ImageClip(path)
                    img = _fit_contain(img, ow, oh)
                    # Center image inside the PiP box when smaller than box
                    iw, ih = img.size
                    box_x = pos[0] if isinstance(pos[0], int) else (frame_w - ow) // 2
                    box_y = pos[1] if isinstance(pos[1], int) else int(frame_h * 0.12)
                    img_x = box_x + max(0, (ow - iw) // 2)
                    img_y = box_y + max(0, (oh - ih) // 2)
                    img = (
                        img.with_duration(dur)
                        .with_start(t0)
                        .with_position((img_x, img_y))
                    )
                    layers.append(img)
                except Exception as e:
                    logger.warning(f"skip overlay {path}: {e}")

        composite = CompositeVideoClip(layers, size=(frame_w, frame_h))
        composite = composite.with_duration(audio_duration)

        os.makedirs(os.path.dirname(combined_video_path) or ".", exist_ok=True)
        ffmpeg_params = ["-r", "30"]
        # Mute video track — narration mixed later in generate_video
        composite.write_videofile(
            combined_video_path,
            codec=config.app.get("video_codec") or "libx264",
            audio=False,
            fps=30,
            threads=max(1, int(threads or 2)),
            logger=None,
            ffmpeg_params=ffmpeg_params,
        )
        composite.close()
    finally:
        try:
            bg.close()
        except Exception:
            pass

    logger.info(f"brainrot combined video written: {combined_video_path}")
    return combined_video_path


def apply_brainrot_subtitle_defaults(params: VideoParams) -> VideoParams:
    """Keep captions in the lower safe zone under the PiP card."""
    # bottom is safest with center_upper overlays
    if not params.subtitle_position or params.subtitle_position in (
        "center",
        "top",
        "custom",
    ):
        params.subtitle_position = "bottom"
    return params
