---
name: video-effects
description: Edits a vertical talking-head video, captions every word and places 21 video effects (green screen, magazine cover, glass break, orbit, dolly zoom, text behind me, frame escape and more) exactly where the person mentions them in the video. Use for "edit my video", "add the effects", "video effects", "text behind me", "green screen", "cut-out", or when someone hands over a raw video with spoken effect cues.
---

# Video effects

The Remotion project lives in `{{REPO}}`. All commands run there. The effects are in
`src/effects/effects.tsx`; per video only `src/project.ts` changes. The list of all effects with their
fields and ingredients is in [catalog.md](catalog.md), the cut-out in [matting.md](matting.md).

Talk to the user simply and without jargon, in their language. They do not need to know any editing
software.

## Workflow

1. **Check the tools.** `node -v` (18 or later), `ffmpeg -version`, `ffprobe -version`. If `node_modules` is
   missing in `{{REPO}}`, run `npm install`. If ffmpeg is missing, tell the user the right way to get it
   (Mac: `brew install ffmpeg`, Windows: `winget install ffmpeg`) and install only after they say yes.

2. **Prepare the video.** Copy the file into `public/` and convert it to vertical 1080 × 1920 with a
   constant frame rate. Phone videos often have a variable frame rate, which would otherwise shift the
   effects:

   ```bash
   ffmpeg -i <input> -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
     -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k public/<name>-raw.mp4
   ```

3. **Transcribe.** `node scripts/transcribe.mjs <name>-raw.mp4` writes word timestamps to
   `public/<name>-raw-captions.json`. On the first run the script downloads whisper.cpp and the speech
   model (about 1.5 GB); tell the user beforehand. Never create the `whisper.cpp/` folder by hand and never
   put a model into it in advance: if the folder exists without a built program, the installation stops.
   In that case delete the folder and run the script again. The language is detected automatically; pass
   its code for better accuracy, e.g. `node scripts/transcribe.mjs <name>-raw.mp4 de` (`en`, `fr`, …).

4. **Cut.** From the word timestamps, decide which parts stay: pauses over 0.5 s go, slips and sentences
   spoken twice go (on a restart, keep the last attempt). Leave 0.08 s before and 0.15 s after each part so
   no word gets clipped. Summarise the cut list for the user in two or three sentences. Join the parts only
   with the concat filter:

   ```bash
   ffmpeg -i public/<name>-raw.mp4 -filter_complex \
     "[0:v]trim=start=1.20:end=4.80,setpts=PTS-STARTPTS[v0];[0:a]atrim=start=1.20:end=4.80,asetpts=PTS-STARTPTS[a0]; \
      [0:v]trim=start=5.60:end=9.10,setpts=PTS-STARTPTS[v1];[0:a]atrim=start=5.60:end=9.10,asetpts=PTS-STARTPTS[a1]; \
      [v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
     -map "[v]" -map "[a]" -c:v libx264 -crf 18 -c:a aac -b:a 192k public/<name>.mp4
   ```

   Then transcribe the cut video again (`node scripts/transcribe.mjs <name>.mp4`): from here on all times
   refer to `<name>.mp4`. If the user does not want a cut, keep using the raw version as `<name>.mp4`.

5. **Pick the effects.** Find the places in the transcript where the user names or describes an effect
   ("now the picture shatters" = `glass`). One cue per effect: `from` just before the word, `to` at the next
   effect or after about 2 to 3 s, `at` = seconds from `from` to the trigger word. If the user names no
   effect but wants some, suggest suitable ones. Show the list as a short table: effect, time, word.

6. **Gather the ingredients** (column Ingredients in the catalog):
   - **Face centre** (`face`): grab a still
     (`ffmpeg -ss <t> -i public/<name>.mp4 -frames:v 1 .cache/face.png`), look at it and read off the
     centre of the face in pixels. Once per video is enough if the person stands still. Every cue gets
     this `face`: zoom points and the position of texts follow it, so nothing covers the face. On the same
     still, read off the chin and set `captionsTop` in `project.ts` about 40 pixels below it (the default
     1170 only fits if the chin is at about 1130).
   - **Empty room** (`plate`, for `text`, `headlines`, `dolly`): ideally the user filmed two seconds
     without themselves, with the same camera position. Otherwise ask whether they can add that, or remove
     the person from a still with an image tool. Without `plate` the effects keep running on the camera
     frame.
   - **Photos** (`src` for `greenscreen`, `studio`): ask the user. Without a photo, the green screen shows
     an evening sky and the studio reveal shows a dark room.
   - **Still for `glass`**: `ffmpeg -ss <from> -i public/<name>.mp4 -frames:v 1 public/<name>-glass.jpg`.

7. **Cut out the person** as soon as an effect marked "Cut-out" is used: follow [matting.md](matting.md).
   The computer does this itself and it takes five to ten times as long as the video. Tell the user
   beforehand.

8. **Write `src/project.ts`.** `video`, `cutout`, `captionsFile`, `captionsTop`, `fps` and
   `durationInSeconds` (read both from `<name>.mp4` with `ffprobe`), `effects` with `total` = number of
   numbered effects. `theme` changes colours (fields in `src/effects/theme.tsx`); the fields `word`,
   `lines`, `prompt`, `badge`, `handle`, `avatar` change texts per cue. Write texts in the language of the
   video. Then run `npm run typecheck`.

9. **Check stills before rendering.** `node scripts/stills.mjs .cache/stills <t1,t2,…>` with one time
   shortly after each trigger word. Look at every image. Done only when no image has text on the face, no
   person shows twice and there is no halo around the cut-out. Otherwise adjust `face`, `at` or the times
   and check again.

10. **Render.** `npx remotion render src/index.ts EffectsVideo out/<name>-effects.mp4`. At the end tell the
    user where the file is, how long it is and which effects are in it. For fine-tuning, mention
    `npm run studio`: there they can watch the video in the browser and scrub back and forth.

## Pitfalls

- **One frame of offset between video and cut-out** gives two heads on every fast movement. The cause is
  almost always the concat demuxer (`-f concat`). So use only the concat filter, and always compute the
  cut-out from exactly the file listed in `video`.
- **Never put text, badges or numbers on the face.** Align space with `face`; the captions start below
  the chin at `captionsTop`.
- **Behind a cut-out that moves a lot, show the empty room** (`plate`); then there can be no second head.
- **Do not clip a rectangle around the head**, it gives straight edges. Clean up the matte itself
  (threshold and erosion in `scripts/make-cutout.sh`).
- **Landscape footage** only fills the vertical frame with a crop. If the person is not centred, set
  `crop=1080:1920:<x>:0` with a suitable x when preparing.
