"""Gemini client factory: AI Studio API key OR Vertex AI (ADC / Startup credits)."""

from __future__ import annotations

import os
from typing import Any

from loguru import logger

from app.config import config


def _truthy(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


def use_vertex_ai() -> bool:
    """Prefer Vertex when explicitly enabled or when ADC is configured without a key."""
    if _truthy(os.environ.get("GOOGLE_GENAI_USE_VERTEXAI")):
        return True
    if _truthy(str(config.app.get("gemini_use_vertex", "") or "")):
        return True
    return False


def vertex_project() -> str:
    return (
        os.environ.get("GOOGLE_CLOUD_PROJECT")
        or os.environ.get("GCLOUD_PROJECT")
        or str(config.app.get("gemini_vertex_project", "") or "").strip()
        or ""
    )


def vertex_location() -> str:
    return (
        os.environ.get("GOOGLE_CLOUD_LOCATION")
        or os.environ.get("GOOGLE_CLOUD_REGION")
        or str(config.app.get("gemini_vertex_location", "") or "").strip()
        or "us-central1"
    )


def create_genai_client(*, api_key: str = "", base_url: str | None = None):
    """Return a google.genai.Client for API key or Vertex AI ADC."""
    from google import genai
    from google.genai import types

    if use_vertex_ai():
        project = vertex_project()
        location = vertex_location()
        if not project:
            raise ValueError(
                "gemini Vertex mode enabled but project is unset. "
                "Set GOOGLE_CLOUD_PROJECT or gemini_vertex_project in config.toml."
            )
        logger.info(f"gemini client: Vertex AI project={project} location={location}")
        return genai.Client(vertexai=True, project=project, location=location)

    key = (api_key or str(config.app.get("gemini_api_key", "") or "")).strip()
    if not key:
        raise ValueError(
            "gemini: api_key is not set and Vertex is not enabled. "
            "Set gemini_api_key or enable Vertex (GOOGLE_GENAI_USE_VERTEXAI=1)."
        )
    http_options = types.HttpOptions(base_url=base_url) if base_url else None
    logger.info("gemini client: AI Studio api_key mode")
    return genai.Client(api_key=key, http_options=http_options)


def gemini_requires_api_key() -> bool:
    return not use_vertex_ai()
