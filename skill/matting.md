# Cut-out with RobustVideoMatting

The cut-out separates the person from the background. The result is a second video file with a
transparent background (WebM with alpha channel) that is layered over the effects. That is how you stand
in front of the text, the magazine masthead or the curve.

RobustVideoMatting (RVM) is a free project under GPL-3.0. It is not shipped with this repo; it is
downloaded from GitHub during setup and lives outside the repo.

| | |
|---|---|
| Location | `~/.cache/claude-video-effects/rvm` (change with `RVM_DIR=…`) |
| Setup | once `bash scripts/setup-rvm.sh` (Python 3.10 to 3.14, about 2 GB including Torch). If `python3` is another version: `PYTHON=/path/to/python3.12 bash scripts/setup-rvm.sh` |
| Existing setup | If RVM already lives somewhere else (a folder with `venv/` and `weights/`), do not download it twice; set `RVM_DIR=<folder>` in front of both scripts. The script only creates files inside its own folder and overwrites nothing outside it |
| Intel Mac | torch no longer ships packages for it. Then work without the cut-out: the effects run, just without the trick of the person standing in front of something |
| Duration | Apple silicon (MPS) about 0.1 s per frame plus encoding, so five to ten times as long as the video (measured: 22 s of video, 3.5 min). Without a GPU much longer; then use `mobilenetv3` instead of `resnet50` |
| Windows | run the steps from both scripts by hand in PowerShell or in WSL |

## Workflow

1. **Set up** (once): `bash scripts/setup-rvm.sh`. Tell the user beforehand that about 2 GB will be
   downloaded.

2. **Cut out** from exactly the file listed under `video` in `project.ts`:

   ```bash
   bash scripts/make-cutout.sh <name>.mp4
   ```

   Result: `public/<name>-cutout.webm`. Enter this name under `cutout` in `project.ts`.

3. **Check alignment.** Both files must start at 0:

   ```bash
   ffprobe -v error -show_entries stream=start_time -of csv=p=0 public/<name>.mp4
   ffprobe -v error -show_entries stream=start_time -of csv=p=0 public/<name>-cutout.webm
   ```

   Then compare at two or three spots with fast movement (ffmpeg only reads the alpha channel with
   `-c:v libvpx-vp9` before the `-i`):

   ```bash
   ffmpeg -ss <t> -i public/<name>.mp4 -c:v libvpx-vp9 -ss <t> -i public/<name>-cutout.webm \
     -filter_complex "[0:v]trim=end_frame=1,format=yuv420p[a];[1:v]trim=end_frame=1,format=yuv420p[b];[a][b]psnr" -f null -
   ```

   About 45 dB or more = aligned. About 25 dB = one frame of offset; the video then shows two heads.

4. **Check the edges.** Look at a still of the cut-out on a light background, at hair, ears and
   shoulders:

   ```bash
   ffmpeg -c:v libvpx-vp9 -ss <t> -i public/<name>-cutout.webm -f lavfi -i color=c=0xf7f5f0:s=1080x1920 \
     -filter_complex "[1][0]overlay=format=auto,trim=end_frame=1" -frames:v 1 .cache/edge.png
   ```

   Nothing nibbled off, no dark or light halo. If a halo remains, add one more `erosion` in
   `scripts/make-cutout.sh`; if hair is missing, remove one.

## Empty room

For `text`, `headlines` and `dolly` it looks cleanest when a picture of the empty room sits behind the
cut-out. Easiest: film two seconds without being in the shot, and do not move the camera. A still from it:

```bash
ffmpeg -ss <t> -i <recording> -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -frames:v 1 public/room.jpg
```

Alternatively, use an image tool that removes the person from a still. Before using it, hold the result
against a real still: walls and edges must line up exactly.
