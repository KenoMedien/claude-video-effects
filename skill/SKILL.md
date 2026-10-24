---
name: video-effects
description: Schneidet ein Sprechvideo im Hochformat, setzt Untertitel für jedes Wort und baut 21 Video-Effekte (Green Screen, Magazin-Cover, Glasbruch, Orbit, Dolly Zoom, Text hinter mir, Rahmen-Ausbruch und weitere) genau an die Stelle, an der die Person sie im Video ausspricht. Nutzen bei „schneide mein Video“, „bau die Effekte ein“, „Video-Effekte“, „Text hinter mir“, „Green Screen“, „Freistellung“ oder wenn jemand ein Rohvideo mit angesagten Effekten übergibt.
---

# Video-Effekte

Das Remotion-Projekt liegt in `{{REPO}}`. Alle Befehle laufen dort. Die Effekte stehen in
`src/effects/effects.tsx`, pro Video wird nur `src/project.ts` geändert. Die Liste aller Effekte mit
Feldern und Zutaten steht in [katalog.md](katalog.md), die Freistellung in [freistellung.md](freistellung.md).

Sprich mit dem Nutzer einfach und ohne Fachwörter. Er muss kein Schnittprogramm kennen.

## Ablauf

1. **Werkzeuge prüfen.** `node -v` (ab 18), `ffmpeg -version`, `ffprobe -version`. Fehlt `node_modules` in
   `{{REPO}}`, `npm install` ausführen. Fehlt ffmpeg, dem Nutzer den passenden Weg nennen (Mac:
   `brew install ffmpeg`, Windows: `winget install ffmpeg`) und erst nach seinem Ja installieren.

2. **Video vorbereiten.** Die Datei nach `public/` holen und auf Hochformat 1080 × 1920 mit fester
   Bildrate bringen. Handyvideos haben oft eine schwankende Bildrate, das verschiebt sonst Effekte:

   ```bash
   ffmpeg -i <eingang> -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30" \
     -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k public/<name>-roh.mp4
   ```

3. **Abtippen.** `node scripts/transcribe.mjs <name>-roh.mp4 de` schreibt Wortzeiten nach
   `public/<name>-roh-captions.json`. Beim ersten Lauf lädt das Skript whisper.cpp und das Sprachmodell
   (rund 1,5 GB); das dem Nutzer vorher sagen. Den Ordner `whisper.cpp/` nie von Hand anlegen und kein
   Modell vorab hineinlegen: Existiert der Ordner ohne fertiges Programm, bricht die Installation ab.
   Dann den Ordner löschen und das Skript neu starten. Andere Sprache: Kürzel statt `de` (`en`, `fr`, …).

4. **Schneiden.** Aus den Wortzeiten die Teile bestimmen, die bleiben: Pausen über 0,5 s raus,
   Versprecher und doppelt gesprochene Sätze raus (beim Neuansatz bleibt der letzte Versuch). Vor jedem
   Teil 0,08 s und nach jedem Teil 0,15 s Luft lassen, damit kein Wort abgeschnitten wird. Die Schnittliste
   dem Nutzer in zwei, drei Sätzen nennen. Zusammensetzen nur mit dem concat-Filter:

   ```bash
   ffmpeg -i public/<name>-roh.mp4 -filter_complex \
     "[0:v]trim=start=1.20:end=4.80,setpts=PTS-STARTPTS[v0];[0:a]atrim=start=1.20:end=4.80,asetpts=PTS-STARTPTS[a0]; \
      [0:v]trim=start=5.60:end=9.10,setpts=PTS-STARTPTS[v1];[0:a]atrim=start=5.60:end=9.10,asetpts=PTS-STARTPTS[a1]; \
      [v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
     -map "[v]" -map "[a]" -c:v libx264 -crf 18 -c:a aac -b:a 192k public/<name>.mp4
   ```

   Danach den geschnittenen Film neu abtippen (`node scripts/transcribe.mjs <name>.mp4 de`): Alle Zeiten
   ab hier beziehen sich auf `<name>.mp4`. Will der Nutzer keinen Schnitt, die Rohfassung unter `<name>.mp4`
   weiterverwenden.

5. **Effekte festlegen.** Im Text die Stellen suchen, an denen der Nutzer einen Effekt nennt oder
   beschreibt („jetzt zerspringt das Bild“ = `glas`). Pro Effekt ein Cue: `from` kurz vor dem Wort,
   `to` beim nächsten Effekt oder nach rund 2 bis 3 s, `at` = Sekunden ab `from` bis zum Zündwort. Nennt
   der Nutzer keinen Effekt, aber will welche, passende vorschlagen. Die Liste als kurze Tabelle
   zeigen: Effekt, Zeitpunkt, Wort.

6. **Zutaten besorgen** (Spalte Zutaten im Katalog):
   - **Gesichtsmitte** (`face`): Ein Standbild ziehen
     (`ffmpeg -ss <t> -i public/<name>.mp4 -frames:v 1 .cache/face.png`), ansehen und die Mitte des
     Gesichts in Bildpunkten ablesen. Einmal pro Video reicht, wenn die Person ruhig steht. Jeder Cue
     bekommt dieses `face`: Daran richten sich Zoompunkte und die Lage von Texten aus, damit nichts auf dem
     Gesicht liegt. Am selben Bild das Kinn ablesen und `captionsTop` in `project.ts` rund 40 Bildpunkte
     darunter setzen (Standard 1170 passt nur, wenn das Kinn bei etwa 1130 liegt).
   - **Leeres Zimmer** (`plate`, für `text`, `schlagzeilen`, `dolly`): Am besten hat der Nutzer zwei
     Sekunden ohne sich selbst gefilmt, bei gleicher Kamera. Sonst fragen, ob er das nachholt, oder mit
     einem Bildwerkzeug die Person aus einem Standbild entfernen. Ohne `plate` laufen die Effekte mit dem
     Kamerabild weiter.
   - **Fotos** (`src` bei `greenscreen`, `studio`): beim Nutzer erfragen. Ohne Foto zeigt Green Screen
     einen Abendhimmel und Studio-Reveal einen dunklen Raum.
   - **Standbild für `glas`**: `ffmpeg -ss <from> -i public/<name>.mp4 -frames:v 1 public/<name>-glas.jpg`.

7. **Freistellen**, sobald ein Effekt mit „Frei“ dabei ist: nach [freistellung.md](freistellung.md). Das
   rechnet der Rechner selbst und dauert fünf- bis zehnmal so lang wie das Video. Vorher ansagen.

8. **`src/project.ts` schreiben.** `video`, `cutout`, `captionsFile`, `captionsTop`, `fps` und `durationInSeconds`
   (beide mit `ffprobe` aus `<name>.mp4` lesen), `effects` mit `total` = Zahl der nummerierten Effekte.
   Farben ändert `theme` (Felder in `src/effects/theme.tsx`), Texte die Felder `word`, `lines`,
   `prompt`, `badge`, `handle`, `avatar` je Cue. Dann `npm run typecheck`.

9. **Standbilder prüfen, bevor gerendert wird.** `node scripts/stills.mjs .cache/stills <t1,t2,…>` mit
   je einem Zeitpunkt kurz nach jedem Zündwort. Jedes Bild ansehen. Fertig erst, wenn auf keinem Bild Text
   auf dem Gesicht liegt, keine Person doppelt zu sehen ist und kein Saum um die Freistellung steht.
   Sonst `face`, `at` oder die Zeiten anpassen und wieder prüfen.

10. **Rendern.** `npx remotion render src/index.ts EffectsVideo out/<name>-effekte.mp4`. Zum Schluss dem
    Nutzer sagen, wo die Datei liegt, wie lang sie ist und welche Effekte drin sind. Zum Feinschliff
    `npm run studio` nennen: Dort sieht er das Video im Browser und kann vor- und zurückspulen.

## Fallen

- **Ein Bild Versatz zwischen Video und Freistellung** ergibt zwei Köpfe bei jeder schnellen Bewegung.
  Ursache ist fast immer der concat-Demuxer (`-f concat`). Darum nur der concat-Filter, und die
  Freistellung immer aus genau der Datei rechnen, die in `video` steht.
- **Text, Badge oder Zahlen nie aufs Gesicht.** Platz an `face` ausrichten; die Untertitel stehen ab
  y 1170 unter dem Kinn.
- **Hinter stark bewegter Freistellung das leere Zimmer zeigen** (`plate`), dann kann es keinen zweiten
  Kopf geben.
- **Kein Rechteck um den Kopf schneiden**, das ergibt gerade Kanten. Die Maske selbst sauber machen
  (Schwelle und Einzug in `scripts/make-cutout.sh`).
- **Querformat** füllt das Hochformat nur mit Zuschnitt. Steht die Person nicht in der Mitte, beim
  Vorbereiten `crop=1080:1920:<x>:0` mit passendem x setzen.
