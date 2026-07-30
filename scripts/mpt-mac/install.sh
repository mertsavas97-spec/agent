#!/usr/bin/env bash
# MoneyPrinterTurbo — Mac local install (Vertex + Pexels + Edge TTS)
set -euo pipefail

MPT_DIR="${MPT_DIR:-$HOME/MoneyPrinterTurbo}"
PROJECT="${GOOGLE_CLOUD_PROJECT:-mpt-shorts-260727}"
LOCATION="${GOOGLE_CLOUD_LOCATION:-us-central1}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "==> Target: $MPT_DIR"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1"; exit 1; }; }

# Homebrew deps
if ! command -v brew >/dev/null 2>&1; then
  echo "Install Homebrew first: https://brew.sh"
  exit 1
fi
brew list ffmpeg >/dev/null 2>&1 || brew install ffmpeg
brew list git >/dev/null 2>&1 || brew install git

# uv
if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi
export PATH="$HOME/.local/bin:$PATH"

# Clone or update
if [[ ! -d "$MPT_DIR/.git" ]]; then
  git clone https://github.com/harry0703/MoneyPrinterTurbo.git "$MPT_DIR"
else
  echo "Repo exists — skipping clone"
fi
cd "$MPT_DIR"

uv python install 3.11
uv sync

# Apply Vertex patches from this kit
mkdir -p app/services
cp "$SCRIPT_DIR/patches/gemini_client.py" app/services/gemini_client.py
# Prefer full file replace for reliability on known 1.3.x layout
if [[ -f app/services/llm.py ]]; then
  cp "$SCRIPT_DIR/patches/llm.py" app/services/llm.py
  cp "$SCRIPT_DIR/patches/voice.py" app/services/voice.py
  echo "Applied Vertex patches (llm/voice/gemini_client)"
fi

# Brainrot mode (Pexels satisfaction BG + PiP)
if [[ -f "$SCRIPT_DIR/patches/brainrot/brainrot.py" ]]; then
  cp "$SCRIPT_DIR/patches/brainrot/brainrot.py" app/services/brainrot.py
  cp "$SCRIPT_DIR/patches/brainrot/task.py" app/services/task.py
  cp "$SCRIPT_DIR/patches/brainrot/schema.py" app/models/schema.py
  cp "$SCRIPT_DIR/patches/brainrot/cli.py" cli.py
  cp "$SCRIPT_DIR/patches/brainrot/Main.py" webui/Main.py
  echo "Applied brainrot mode patches"
fi

# config.toml
if [[ ! -f config.toml ]]; then
  cp config.example.toml config.toml
fi

python3 - << PY
from pathlib import Path
import os, re
p = Path("config.toml")
t = p.read_text()
def set_kv(text, key, value):
    pat = re.compile(rf'^{re.escape(key)}\s*=.*$', re.M)
    line = f"{key} = {value}"
    if pat.search(text):
        return pat.sub(line, text, count=1)
    # insert under [app] if possible
    if "[app]" in text:
        return text.replace("[app]", "[app]\n" + line, 1)
    return text + f"\n{line}\n"

project = os.environ.get("GOOGLE_CLOUD_PROJECT", "$PROJECT")
location = os.environ.get("GOOGLE_CLOUD_LOCATION", "$LOCATION")
pexels = os.environ.get("PEXELS_API_KEY", "").strip()

t = set_kv(t, "llm_provider", '"gemini"')
t = set_kv(t, "gemini_model_name", '"gemini-2.5-flash"')
t = set_kv(t, "gemini_use_vertex", "true")
t = set_kv(t, "gemini_vertex_project", f'"{project}"')
t = set_kv(t, "gemini_vertex_location", f'"{location}"')
t = set_kv(t, "video_source", '"pexels"')
t = set_kv(t, "subtitle_provider", '"edge"')
t = set_kv(t, "render_mode", '"pexels"')
t = set_kv(t, "brainrot_bg_pack", '"satisfaction"')
t = set_kv(t, "brainrot_overlay_count", "5")
t = set_kv(t, "brainrot_overlay_max_width_pct", "0.64")
t = set_kv(t, "brainrot_overlay_max_height_pct", "0.42")
t = set_kv(t, "brainrot_overlay_max_coverage", "0.55")
t = set_kv(t, "brainrot_overlay_position", '"center_upper"')
if pexels:
    t = set_kv(t, "pexels_api_keys", f'["{pexels}"]')
# UI voice
t = set_kv(t, "voice_name", '"en-US-JennyNeural"')
p.write_text(t)
print("config.toml updated")
if not pexels:
    print("NOTE: set PEXELS_API_KEY env before install, or edit pexels_api_keys in config.toml")
PY

# vertex.env
cat > "$MPT_DIR/vertex.env" << ENV
export PATH="\$HOME/.local/bin:\$PATH"
export GOOGLE_GENAI_USE_VERTEXAI=1
export GOOGLE_CLOUD_PROJECT=$PROJECT
export GOOGLE_CLOUD_LOCATION=$LOCATION
ENV

# run helper
cat > "$MPT_DIR/run-local.sh" << 'RUN'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/vertex.env"
export MPT_WEBUI_HOST="${MPT_WEBUI_HOST:-127.0.0.1}"
export MPT_WEBUI_PORT="${MPT_WEBUI_PORT:-8501}"
case "${1:-webui}" in
  webui)
    if [[ "$(uname -s)" == "Darwin" ]] && [[ "${MPT_OPEN_BROWSER:-1}" == "1" ]]; then
      (
        for _ in $(seq 1 60); do
          if curl -sf -o /dev/null "http://127.0.0.1:${MPT_WEBUI_PORT}/"; then
            open -a "Google Chrome" "http://127.0.0.1:${MPT_WEBUI_PORT}/" 2>/dev/null \
              || open "http://127.0.0.1:${MPT_WEBUI_PORT}/"
            exit 0
          fi
          sleep 1
        done
      ) &
    fi
    echo "WebUI → http://127.0.0.1:${MPT_WEBUI_PORT}"
    exec sh webui.sh
    ;;
  api) exec uv run python main.py ;;
  cli) shift; exec uv run python cli.py "$@" ;;
  *) echo "Usage: $0 {webui|api|cli}"; exit 1 ;;
esac
RUN
chmod +x "$MPT_DIR/run-local.sh"

# Convenience alias
cat > "$MPT_DIR/open-chrome.sh" << 'OPEN'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
exec ./run-local.sh webui
OPEN
chmod +x "$MPT_DIR/open-chrome.sh"

echo
echo "==> ADC check (Vertex)"
if [[ -f "$HOME/.config/gcloud/application_default_credentials.json" ]]; then
  echo "ADC found OK"
else
  echo "Run once (for Gemini scripts via Vertex):"
  echo "  gcloud auth application-default login"
  echo "  gcloud auth application-default set-quota-project $PROJECT"
fi

echo
echo "DONE — LOCAL ONLY (no Remote Control)."
echo "  cd $MPT_DIR && ./open-chrome.sh"
echo "  Chrome → http://127.0.0.1:8501"
