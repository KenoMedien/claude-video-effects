# Video Effects for Claude

21 video effects for vertical talking-head videos. You say in the video what should happen. Claude Code
edits your video, captions every word and places each effect exactly where you mention it.

I built these effects for one of my own videos and turned them into this repo so you can use them in
your videos too. No editing software needed.

## What you need

- **Claude Code** with a Claude subscription, ideally with the strongest model and a high effort setting
- **Mac or Linux.** Windows works as well; Claude does a few steps there by hand
- **Node.js** 18 or later and **ffmpeg**. If something is missing, Claude will tell you
- About **5 GB of free disk space** (speech recognition and the cut-out download their models the first time)

## Install with Claude

Open Claude Code and paste this prompt:

```text
Install the video effects from https://github.com/KenoMedien/claude-video-effects. Read the README in the repo and follow the section "Installation for Claude". Then check yourself that everything works, and tell me if you need anything from me.
```

## Installation for Claude

Claude runs these steps. Before installing any program (for example ffmpeg), Claude asks the user.

1. Get the repo: `git clone https://github.com/KenoMedien/claude-video-effects.git ~/claude-video-effects`
   (Windows: `%USERPROFILE%\claude-video-effects`)
2. Run `npm install` in the repo folder.
3. Check: `node -v` (18 or later), `ffmpeg -version`. If ffmpeg is missing: Mac `brew install ffmpeg`,
   Windows `winget install ffmpeg`, Linux via the package manager. Only after the user says yes.
4. Set up the skill: `bash scripts/install-skill.sh`. This copies `skill/` to
   `~/.claude/skills/video-effects/` and writes the repo path into it. Windows without bash: copy the
   three files from `skill/` to `%USERPROFILE%\.claude\skills\video-effects\` and replace `{{REPO}}` in
   all three with the full repo path.
5. Sanity check: `npm run typecheck` has to pass without errors.
6. Tell the user: the effects are ready. If Claude does not know the `video-effects` skill right away,
   restart Claude Code once. Speech recognition and the cut-out are only downloaded with the first video.

## How to use it

1. **Record.** Vertical format, stand still, good light. Just announce the effects in the video, for
   example: "Now the picture shatters like glass." or "Behind me there is a giant word now."
2. **Tip:** At the end, film two seconds of the empty room without yourself, and do not move the camera.
   That makes "Text behind me", "Headline storm" and "Dolly zoom" look cleanest.
3. **Give Claude the file:**

   ```text
   Edit my video raw-video.mov in vertical format. Caption every word and add each effect exactly where I mention it.
   ```

Claude shows you beforehand which effect lands where. At the end the finished video is in `out/`. With
`npm run studio` you can watch it in the browser and ask for changes at any point.

## The 21 effects

| No. | Effect | What happens |
|---|---|---|
| 01 | Green screen | studio green behind you, then a photo opens up |
| 02 | Magazine cover | you as the cover, the masthead sits behind your head |
| 03 | Chat takeover | your video shrinks into a chat message |
| 04 | Growth curve | a glowing curve shoots up behind you |
| 05 | Glass break | the picture cracks and falls apart in shards |
| 06 | Orbit | icons circle your head, passing behind you |
| 07 | Dolly zoom | you keep your size, the room contracts |
| 08 | Paper cutout | you as a paper cut-out with a white edge |
| 09 | Headline storm | breaking-news bands fly in and run behind you |
| 10 | Phone mock-up | your video shrinks into a phone |
| 11 | Snap zoom | a lightning-fast jump onto your face |
| 12 | Studio reveal | the lights switch on in a dark studio |
| 13 | Liquid glass | a glass lens glides over the picture |
| 14 | Zoom portal | the camera flies into a circle |
| 15 | B-roll overlay | an editing program slides up, your video plays inside it |
| 16 | Text behind me | a giant word stands behind you |
| 17 | Digital zoom | camera viewfinder with REC, then a zoom |
| 18 | Frame escape | you climb out of your own picture |
| 19 | Zoom cut | a blurred zoom in and back out |
| 20 | Check pop | pills with check marks above your head |
| 21 | Checklist | every effect gets ticked off |

Missing an effect? Describe it to Claude in one sentence. The 21 effects show Claude how something like
that is built. Colours and texts can be changed; details in `skill/catalog.md`.

## What is in the repo

| Folder | Contents |
|---|---|
| `skill/` | the instructions for Claude: workflow, effect catalog, cut-out |
| `src/effects/` | the 21 effects (Remotion, TypeScript) and the colours |
| `src/project.ts` | the one file Claude fills in per video |
| `scripts/` | speech recognition, cut-out, stills, skill installation |
| `public/` | your video and intermediate files go here; they stay on your machine |

## Licenses

- **This repo:** MIT, see [LICENSE](LICENSE).
- **Remotion** (renders the videos) has its own license: free for individuals, companies with up to
  three employees and non-profit organisations; larger companies need a company license.
  Details: [remotion.dev/license](https://www.remotion.dev/license).
- **Montserrat** (font): SIL Open Font License 1.1, see `public/fonts/OFL-Montserrat.txt`.
- **whisper.cpp** (speech recognition): MIT. Downloaded the first time you transcribe; not part of this repo.
- **RobustVideoMatting** (cut-out): GPL-3.0. Downloaded by `scripts/setup-rvm.sh`; not part of this repo.

Built by Robin Csipke. More videos about Claude and AI: Instagram and TikTok `@robincsipke`.
