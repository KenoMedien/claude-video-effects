#!/usr/bin/env bash
# Cut the person out of a video: RVM matte, then a WebM with alpha next to the video in public/.
# usage: bash scripts/make-cutout.sh <video in public/> [resnet50|mobilenetv3]
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: bash scripts/make-cutout.sh <video in public/> [resnet50|mobilenetv3]" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RVM_DIR="${RVM_DIR:-$HOME/.cache/claude-video-effects/rvm}"
VARIANT="${2:-resnet50}"
VIDEO="$ROOT/public/$1"
NAME="$(basename "${1%.*}")"
MASKS="$ROOT/.cache/$NAME-masks"
OUT="$ROOT/public/$NAME-cutout.webm"

[ -f "$VIDEO" ] || { echo "Video not found: $VIDEO" >&2; exit 1; }
[ -x "$RVM_DIR/venv/bin/python" ] || { echo "RVM missing, run: bash scripts/setup-rvm.sh" >&2; exit 1; }

FPS="$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$VIDEO")"

rm -rf "$MASKS"
mkdir -p "$MASKS"
"$RVM_DIR/venv/bin/python" -I "$ROOT/scripts/rvm-alpha.py" "$RVM_DIR" "$RVM_DIR/weights/rvm_$VARIANT.pth" "$VARIANT" "$VIDEO" "$MASKS" 0.25

# Threshold removes haze (alpha below 15 % gone, above 90 % solid); five erosions plus a soft
# blur remove the halo that bright screens or lettering behind the head leave on the edge.
ffmpeg -y -loglevel error -i "$VIDEO" -framerate "$FPS" -i "$MASKS/%04d.png" -filter_complex \
  "[1]format=gray,lut=y='clip((val-38)*255/(230-38),0,255)',erosion,erosion,erosion,erosion,erosion,gblur=sigma=1.2[a];[0:v][a]alphamerge,format=yuva420p" \
  -an -c:v libvpx-vp9 -pix_fmt yuva420p -crf 14 -b:v 0 -auto-alt-ref 0 -row-mt 1 -deadline good -cpu-used 2 "$OUT"

echo "$OUT"
