#!/usr/bin/env bash
# Re-sync skills from github.com/mertsavas97-spec/cursor-agent-kit
# Keeps ÇözBil project files (PROJECT_BRIEF, AGENTS, cozbil-* skills).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KIT_URL="${CURSOR_AGENT_KIT_URL:-https://github.com/mertsavas97-spec/cursor-agent-kit.git}"
TMP="${TMPDIR:-/tmp}/cursor-agent-kit-sync-$$"

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

echo "→ Cloning kit…"
git clone --depth 1 "$KIT_URL" "$TMP"

command -v rsync >/dev/null || { echo "rsync required"; exit 1; }

mkdir -p "$ROOT/.agents/skills" "$ROOT/.codex/skills"
echo "→ Sync agents skills…"
rsync -a --delete \
  --exclude 'cozbil-guardian/' \
  --exclude 'cozbil-expo-mobile/' \
  --exclude 'cozbil-team-skills/' \
  "$TMP/skills/agents/" "$ROOT/.agents/skills/"

echo "→ Sync codex skills…"
rsync -a --delete \
  --exclude 'taksitdefter-*/' \
  "$TMP/skills/codex/" "$ROOT/.codex/skills/"

# Strip other-product leftovers if kit reintroduces them
rm -rf "$ROOT/.agents/skills"/taksitdefter-* \
       "$ROOT/.agents/skills"/workspace-guardian \
       "$ROOT/.codex/skills"/taksitdefter-*

# Refresh generic coordinator templates only if missing
mkdir -p "$ROOT/docs/agent" "$ROOT/.cursor/rules"
[[ -f "$ROOT/docs/agent/OPENING_PROMPT.md" ]] || cp "$TMP/templates/docs/agent/OPENING_PROMPT.md" "$ROOT/docs/agent/"

AGENTS_N=$(ls -1d "$ROOT/.agents/skills"/*/ 2>/dev/null | wc -l | tr -d ' ')
CODEX_N=$(ls -1d "$ROOT/.codex/skills"/*/ 2>/dev/null | wc -l | tr -d ' ')

cat > "$ROOT/.cursor-agent-kit.json" << EOF
{
  "kitUrl": "$KIT_URL",
  "project": "cozbil",
  "syncedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "agentsSkills": $AGENTS_N,
  "codexSkills": $CODEX_N
}
EOF

echo "✅ Sync complete — agents=$AGENTS_N codex=$CODEX_N"
echo "   ÇözBil files preserved: PROJECT_BRIEF, AGENTS, docs/agent/*, cozbil-* skills"
