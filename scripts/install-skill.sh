#!/usr/bin/env bash
# Install the Claude Code skill for this repo as a personal skill (~/.claude/skills/video-effects).
# usage: bash scripts/install-skill.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$HOME/.claude/skills/video-effects"

mkdir -p "$TARGET"
cp "$ROOT"/skill/*.md "$TARGET/"
# The skill has to know where the Remotion project lives.
sed -i.bak "s|{{REPO}}|$ROOT|g" "$TARGET"/*.md
rm -f "$TARGET"/*.bak

echo "Skill installed in $TARGET (project: $ROOT)"
