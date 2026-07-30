#!/usr/bin/env bash
# NarratoAI — Mac Desktop install (Vertex / Startup credits, same project as MPT)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# User asked for Desktop
NARRATO_DIR="${NARRATO_DIR:-$HOME/Desktop/NarratoAI}"
PROJECT="${GOOGLE_CLOUD_PROJECT:-mpt-shorts-260727}"
LOCATION="${GOOGLE_CLOUD_LOCATION:-us-central1}"
# Vertex OpenAI-compatible model ids
TEXT_MODEL="${NARRATO_TEXT_MODEL:-google/gemini-2.5-flash}"
VISION_MODEL="${NARRATO_VISION_MODEL:-google/gemini-2.5-flash}"
export GOOGLE_CLOUD_PROJECT="$PROJECT"
export GOOGLE_CLOUD_LOCATION="$LOCATION"
export NARRATO_TEXT_MODEL="$TEXT_MODEL"
export NARRATO_VISION_MODEL="$VISION_MODEL"

echo "==> Target: $NARRATO_DIR"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This script targets macOS Desktop. Continue only if you know what you're doing."
fi

if ! command -v brew >/dev/null 2>&1; then
  echo "Install Homebrew first: https://brew.sh"
  exit 1
fi
brew list ffmpeg >/dev/null 2>&1 || brew install ffmpeg
brew list git >/dev/null 2>&1 || brew install git

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
export PATH="$HOME/.local/bin:$PATH"

if [[ ! -d "$NARRATO_DIR/.git" ]]; then
  mkdir -p "$(dirname "$NARRATO_DIR")"
  git clone https://github.com/linyqh/NarratoAI.git "$NARRATO_DIR"
else
  echo "Repo exists — skipping clone"
fi
cd "$NARRATO_DIR"

# NarratoAI requires Python >= 3.12
uv python install 3.12
uv sync
uv add google-auth 2>/dev/null || uv pip install google-auth

# Apply Vertex patches
cp "$SCRIPT_DIR/patches/openai_base_url_security.py" app/utils/openai_base_url_security.py
cp "$SCRIPT_DIR/patches/openai_compatible_provider.py" app/services/llm/openai_compatible_provider.py
echo "Applied Vertex ADC patches"

if [[ ! -f config.toml ]]; then
  cp config.example.toml config.toml
fi

VERTEX_BASE="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/endpoints/openapi"

python3 - << PY
from pathlib import Path
import re, os

p = Path("config.toml")
t = p.read_text()

def set_kv(text, key, value, section_hint=None):
    # Prefer replacing existing key globally (Narrato uses indented keys under [app])
    pat = re.compile(rf'^(\s*){re.escape(key)}\s*=.*$', re.M)
    # Keep indentation if present
    m = pat.search(text)
    if m:
        indent = m.group(1)
        return pat.sub(f'{indent}{key} = {value}', text, count=1)
    if "[app]" in text:
        return text.replace("[app]", f"[app]\n    {key} = {value}", 1)
    return text + f"\n{key} = {value}\n"

project = os.environ.get("GOOGLE_CLOUD_PROJECT", "$PROJECT")
location = os.environ.get("GOOGLE_CLOUD_LOCATION", "$LOCATION")
base = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project}/locations/{location}/endpoints/openapi"
text_model = os.environ.get("NARRATO_TEXT_MODEL", "$TEXT_MODEL")
vision_model = os.environ.get("NARRATO_VISION_MODEL", "$VISION_MODEL")

# LLM → Vertex OpenAI-compatible (Startup credits via ADC)
t = set_kv(t, "vision_llm_provider", '"openai"')
t = set_kv(t, "vision_openai_model_name", f'"{vision_model}"')
t = set_kv(t, "vision_openai_api_key", '"ADC"')  # placeholder; runtime uses ADC
t = set_kv(t, "vision_openai_base_url", f'"{base}"')
t = set_kv(t, "text_llm_provider", '"openai"')
t = set_kv(t, "text_openai_model_name", f'"{text_model}"')
t = set_kv(t, "text_openai_api_key", '"ADC"')
t = set_kv(t, "text_openai_base_url", f'"{base}"')

# Vertex flags (read by patched provider)
t = set_kv(t, "vertex_use_adc", "true")
t = set_kv(t, "gemini_use_vertex", "true")
t = set_kv(t, "gemini_vertex_project", f'"{project}"')
t = set_kv(t, "gemini_vertex_location", f'"{location}"')

# Free TTS — Edge (no paid key). EN default aligned with Shorts; change in UI if needed.
t = set_kv(t, "tts_engine", '"edge_tts"')
t = set_kv(t, "edge_voice_name", '"en-US-JennyNeural-Female"')

p.write_text(t)
print("config.toml → Vertex project", project, "location", location)
print("text/vision model:", text_model)
PY

# env file
cat > "$NARRATO_DIR/vertex.env" << ENV
export PATH="\$HOME/.local/bin:\$PATH"
export GOOGLE_CLOUD_PROJECT=$PROJECT
export GOOGLE_CLOUD_LOCATION=$LOCATION
export GOOGLE_GENAI_USE_VERTEXAI=1
ENV

# launchers
cat > "$NARRATO_DIR/run-local.sh" << 'RUN'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/vertex.env"
export MPT_WEBUI_HOST="${MPT_WEBUI_HOST:-127.0.0.1}"
HOST="${NARRATO_HOST:-127.0.0.1}"
PORT="${NARRATO_PORT:-8501}"

case "${1:-webui}" in
  webui)
    if [[ "$(uname -s)" == "Darwin" ]] && [[ "${NARRATO_OPEN_BROWSER:-1}" == "1" ]]; then
      (
        for _ in $(seq 1 90); do
          if curl -sf -o /dev/null "http://${HOST}:${PORT}/"; then
            open -a "Google Chrome" "http://${HOST}:${PORT}/" 2>/dev/null \
              || open "http://${HOST}:${PORT}/"
            exit 0
          fi
          sleep 1
        done
      ) &
    fi
    echo "NarratoAI WebUI → http://${HOST}:${PORT}"
    exec uv run streamlit run webui.py \
      --server.address="$HOST" \
      --server.port="$PORT" \
      --server.maxUploadSize=2048 \
      --browser.gatherUsageStats=false
    ;;
  *)
    echo "Usage: $0 webui"
    exit 1
    ;;
esac
RUN
chmod +x "$NARRATO_DIR/run-local.sh"

cat > "$NARRATO_DIR/open-chrome.sh" << 'OPEN'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
exec ./run-local.sh webui
OPEN
chmod +x "$NARRATO_DIR/open-chrome.sh"

echo
echo "==> ADC check (same as MoneyPrinterTurbo / Startup credits)"
if [[ -f "$HOME/.config/gcloud/application_default_credentials.json" ]]; then
  if gcloud auth application-default print-access-token >/dev/null 2>&1; then
    echo "ADC OK"
  else
    echo "ADC present but expired. Run:"
    echo "  gcloud auth application-default login"
    echo "  gcloud auth application-default set-quota-project $PROJECT"
  fi
else
  echo "Run once:"
  echo "  gcloud auth application-default login"
  echo "  gcloud auth application-default set-quota-project $PROJECT"
fi

echo
echo "DONE. Start:"
echo "  cd $NARRATO_DIR && ./open-chrome.sh"
echo "  Chrome → http://127.0.0.1:8501"
