#!/usr/bin/env bash
# One-time setup of RobustVideoMatting (cut-out of the person) outside this repo.
# usage: bash scripts/setup-rvm.sh
set -euo pipefail

RVM_DIR="${RVM_DIR:-$HOME/.cache/claude-video-effects/rvm}"
PYTHON="${PYTHON:-python3}"

# torch ships wheels for Python 3.10 to 3.14; on macOS only for Apple silicon.
if ! "$PYTHON" -c 'import sys; sys.exit(0 if (3, 10) <= sys.version_info[:2] <= (3, 14) else 1)'; then
  echo "Python 3.10 to 3.14 needed, found: $("$PYTHON" -V 2>&1). Set PYTHON=/path/to/python3.12 and run again." >&2
  exit 1
fi
if [ "$(uname -s)" = "Darwin" ] && [ "$(uname -m)" != "arm64" ]; then
  echo "torch has no packages for Intel Macs. The effects still work without the cut-out." >&2
  exit 1
fi

mkdir -p "$(dirname "$RVM_DIR")"
if [ ! -d "$RVM_DIR/.git" ]; then
  git clone --depth 1 https://github.com/PeterL1n/RobustVideoMatting.git "$RVM_DIR"
fi

if [ ! -x "$RVM_DIR/venv/bin/python" ]; then
  "$PYTHON" -m venv "$RVM_DIR/venv"
fi
"$RVM_DIR/venv/bin/python" -m pip install --upgrade pip
# Known to work together: Python 3.11, torch 2.x, av 18, pims 0.7.
"$RVM_DIR/venv/bin/python" -m pip install torch torchvision av pims tqdm

mkdir -p "$RVM_DIR/weights"
for variant in resnet50 mobilenetv3; do
  file="$RVM_DIR/weights/rvm_$variant.pth"
  if [ ! -s "$file" ]; then
    curl -fL --progress-bar -o "$file" "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_$variant.pth"
  fi
done

echo "RVM ready in $RVM_DIR"
