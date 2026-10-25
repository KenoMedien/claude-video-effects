# Effect catalog

Code: `{{REPO}}/src/effects/effects.tsx`. The effects are entered in `{{REPO}}/src/project.ts` under
`effects`. The frame is always 1080 × 1920 pixels; times are seconds in the finished, cut video.

## Usage

```ts
effects: {
  total: 3,
  cues: [
    { kind: "greenscreen", from: 2.4, to: 4.6, nr: 1, name: "Green screen", at: 0.6, src: "city.jpg" },
    { kind: "glass", from: 4.6, to: 6.2, nr: 2, name: "Glass break", at: 0.4, face: { x: 560, y: 840 }, src: "my-video-glass.jpg" },
    { kind: "text", from: 6.2, to: 8.9, nr: 3, name: "Text behind me", at: 0.3, word: "AI", plate: "room.jpg" },
  ],
},
```

| Field | Meaning |
|---|---|
| `kind` | effect from the table below |
| `from`, `to` | window in seconds; the effect covers the whole window |
| `nr`, `name` | header row at the top (red number, name, progress bars up to `total`). `nr: 0` = no header |
| `at` | trigger word in seconds from `from` |
| `face` | face centre in pixels, default `{ x: 540, y: 820 }`. Always measure it and set it on every cue: zoom points and the position of texts (preview, magazine column, check pills) follow it |
| `src` | image in `public/` (photo, empty room, still) |
| `plate` | empty room in `public/`, shown behind the cut-out instead of the camera frame |
| `word` | `text`: the word behind you (default "WOW"; long words get smaller). `magazine`: masthead (default "COVER"). `checklist`: closing line |
| `lines` | text lines, depending on the effect (see table) |
| `prompt` | `chat`: the message in the speech bubble |
| `badge` | `magazine`: text on the round sticker (default "NEW"). `chat`: small chip next to the name |
| `avatar` | `phone`: profile picture in `public/`. Without a picture a coloured circle with the first letter shows |
| `handle` | `phone`: account name (default "yourname") |

Each effect runs only in its own window. Between two effects, the header of the previous one stays up.

## The effects

"Cut-out" means: needs the cut-out (`cutout` in `project.ts`, see [matting.md](matting.md)). Without the
cut-out these effects still run, just without the trick of you standing in front of something.

| kind | Name | What happens on screen | Ingredients | Texts |
|---|---|---|---|---|
| `preview` | (intro) | all effect names pop up above the head | | `nr: 0`; the names come from the other cues |
| `greenscreen` | Green screen | studio green behind you, on `at` a circle opens a photo | Cut-out, photo `src` (vertical) | |
| `magazine` | Magazine cover | cover shoot on a light backdrop, masthead behind the head, text column, sticker, barcode | Cut-out | `word` masthead, `lines` [kicker, big number, title, subtitle], `badge` |
| `chat` | Chat takeover | the frame shrinks into the attachment of a chat message, reply "On it." with three checks | | `prompt`, `lines` three steps, `badge` |
| `curve` | Growth curve | you in front of a dark grid, a glowing curve shoots up behind you | Cut-out | `lines` [bottom, top]; no made-up numbers |
| `glass` | Glass break | cracks over a still, then 84 shards fall, the video plays underneath | still `src` | `at` ≈ 0.4 |
| `orbit` | Orbit | six icons circle at head height, passing behind you | Cut-out, `face` | |
| `dolly` | Dolly zoom | you keep your size, the empty room contracts | Cut-out, empty room `src` or `plate`, `face` | |
| `paper` | Paper cutout | golden surface with paper grain, you with a white edge, star, circle, bar | Cut-out | |
| `headlines` | Headline storm | five breaking-news bands fly in and run behind you | Cut-out, better with `plate` | `lines` up to five headlines |
| `phone` | Phone mock-up | the frame shrinks into a phone with a Reels-style interface | | `handle`, `avatar` |
| `snap` | Snap zoom | jump to 1.62× in 0.13 s | `face` as zoom point | |
| `studio` | Studio reveal | dark studio, on `at` the lamps flicker on, ON AIR lights up | Cut-out, studio photo `src` | `at` on "light" |
| `liquid` | Liquid glass | a distorting glass lens glides over the face | `face` | |
| `portal` | Zoom portal | circle with the live frame at the top left, the camera flies into it | | `at` on the word |
| `broll` | B-roll overlay | an editing program slides up, your video plays in the preview window, a clip drops onto the track | | `at` on "B-roll" |
| `text` | Text behind me | a giant word behind you, you move in front of it | Cut-out, `plate` | `word` |
| `viewfinder` | Digital zoom | camera viewfinder with REC, timecode, zoom 1.0x → 2.0x | `face` | `at` on the word, zoom 0.96 s later |
| `frame` | Frame escape | the frame becomes a tilted card, your head climbs over its top edge | Cut-out, `face` | |
| `zoomcut` | Zoom cut | blurred zoom in, flash, back out | `face` | |
| `checks` | Check pop | up to four pills with check marks above the head | | `lines` |
| `checklist` | Checklist | all numbered effects get ticked off, a counter runs along | | `word` closing line |

## Colours

`theme` in `project.ts` overrides individual colours, for example
`theme: { accent: "#7c3aed", deep: "#1e1b4b" }`. All fields with explanations are in
`src/effects/theme.tsx`. Font: Montserrat is included (`public/fonts/`); use another font via
`theme.font` and your own `FontFace` in `src/fonts.ts`.

## Displacement map for `liquid`

Ships ready-made as `public/lens-map.png`. To generate it again (400 × 400; the red and green channels push
inwards towards the edge):

```bash
ffmpeg -f lavfi -i "color=c=black:s=400x400,format=rgb24" -frames:v 1 -vf "geq=r='clip(128-127*((X-200)/200)*pow(min(hypot(X-200,Y-200)/200,1),2)*lt(hypot(X-200,Y-200),200),0,255)':g='clip(128-127*((Y-200)/200)*pow(min(hypot(X-200,Y-200)/200,1),2)*lt(hypot(X-200,Y-200),200),0,255)':b='128'" public/lens-map.png
```
