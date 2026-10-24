# Freistellung mit RobustVideoMatting

Die Freistellung löst die Person vom Hintergrund. Daraus entsteht eine zweite Videodatei mit
durchsichtigem Hintergrund (WebM mit Alphakanal), die über die Effekte gelegt wird. Damit stehst du vor
dem Text, vor dem Magazintitel oder vor der Kurve.

RobustVideoMatting (RVM) ist ein freies Projekt unter GPL-3.0. Es wird nicht mit diesem Repo
ausgeliefert, sondern beim Einrichten von GitHub geladen und liegt außerhalb des Repos.

| | |
|---|---|
| Ort | `~/.cache/claude-video-effects/rvm` (änderbar mit `RVM_DIR=…`) |
| Einrichten | einmal `bash scripts/setup-rvm.sh` (Python 3.10 bis 3.14, rund 2 GB mit Torch). Ist `python3` eine andere Fassung: `PYTHON=/pfad/zu/python3.12 bash scripts/setup-rvm.sh` |
| Vorhandene Einrichtung | Liegt RVM schon woanders (Ordner mit `venv/` und `weights/`), nicht doppelt laden, sondern `RVM_DIR=<ordner>` vor beide Skripte setzen. Das Skript legt nur unter seinem eigenen Ordner an und überschreibt nichts außerhalb |
| Intel-Mac | torch hat dafür keine Pakete mehr. Dann ohne Freistellung arbeiten: Die Effekte laufen, nur ohne den Trick, dass die Person vor etwas steht |
| Dauer | Apple Silicon (MPS) rund 0,1 s je Bild plus Kodierung, also fünf- bis zehnmal so lang wie das Video (gemessen: 22 s Video, 3,5 min). Ohne Grafikchip deutlich länger, dann `mobilenetv3` statt `resnet50` nehmen |
| Windows | die Schritte aus den beiden Skripten von Hand in PowerShell oder in WSL ausführen |

## Ablauf

1. **Einrichten** (einmal): `bash scripts/setup-rvm.sh`. Vorher dem Nutzer sagen, dass rund 2 GB geladen
   werden.

2. **Freistellen** aus genau der Datei, die in `project.ts` unter `video` steht:

   ```bash
   bash scripts/make-cutout.sh <name>.mp4
   ```

   Ergebnis: `public/<name>-cutout.webm`. Diesen Namen in `project.ts` unter `cutout` eintragen.

3. **Deckungsgleich prüfen.** Beide Dateien müssen bei 0 starten:

   ```bash
   ffprobe -v error -show_entries stream=start_time -of csv=p=0 public/<name>.mp4
   ffprobe -v error -show_entries stream=start_time -of csv=p=0 public/<name>-cutout.webm
   ```

   Dann an zwei, drei Stellen mit schneller Bewegung vergleichen (der Alphakanal wird nur mit
   `-c:v libvpx-vp9` vor dem `-i` gelesen):

   ```bash
   ffmpeg -ss <t> -i public/<name>.mp4 -c:v libvpx-vp9 -ss <t> -i public/<name>-cutout.webm \
     -filter_complex "[0:v]trim=end_frame=1,format=yuv420p[a];[1:v]trim=end_frame=1,format=yuv420p[b];[a][b]psnr" -f null -
   ```

   Rund 45 dB oder mehr = deckungsgleich. Rund 25 dB = ein Bild Versatz, im Video sind dann zwei Köpfe.

4. **Kanten prüfen.** Ein Standbild der Freistellung vor hellem Grund ansehen, an Haaren, Ohren und
   Schultern:

   ```bash
   ffmpeg -c:v libvpx-vp9 -ss <t> -i public/<name>-cutout.webm -f lavfi -i color=c=0xf7f5f0:s=1080x1920 \
     -filter_complex "[1][0]overlay=format=auto,trim=end_frame=1" -frames:v 1 .cache/kante.png
   ```

   Nichts angeknabbert, kein dunkler oder heller Saum. Bleibt ein Saum, in `scripts/make-cutout.sh` eine
   `erosion` mehr setzen; fehlen Haare, eine weniger.

## Leeres Zimmer

Für `text`, `schlagzeilen` und `dolly` sieht es am saubersten aus, wenn hinter der Freistellung ein Bild
des leeren Zimmers liegt. Am einfachsten: zwei Sekunden filmen, ohne selbst im Bild zu sein, Kamera nicht
bewegen. Ein Standbild daraus:

```bash
ffmpeg -ss <t> -i <aufnahme> -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -frames:v 1 public/zimmer.jpg
```

Alternativ ein Bildwerkzeug, das die Person aus einem Standbild entfernt. Vor dem Einsatz das Ergebnis
gegen ein echtes Standbild halten: Wände und Kanten müssen genau übereinanderliegen.
