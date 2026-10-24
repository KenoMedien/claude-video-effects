# Video-Effekte für Claude

21 Video-Effekte für Sprechvideos im Hochformat. Du sagst im Video, was passieren soll. Claude Code
schneidet dein Video, setzt Untertitel für jedes Wort und baut jeden Effekt genau an die Stelle, an der
du ihn nennst.

Ich habe die Effekte für eines meiner Videos gebaut und daraus dieses Repo gemacht, damit du sie in
deinen eigenen Videos nutzen kannst. Kein Schnittprogramm nötig.

## Was du brauchst

- **Claude Code** mit einem Claude-Abo, am besten mit dem stärksten Modell und hohem Effort
- **Mac oder Linux.** Windows geht auch, ein paar Schritte macht Claude dort von Hand
- **Node.js** ab Version 18 und **ffmpeg**. Fehlt etwas, sagt Claude dir Bescheid
- Rund **5 GB freien Speicher** (Spracherkennung und Freistellung laden beim ersten Mal ihre Modelle)

## Installation mit Claude

Öffne Claude Code und füge diesen Prompt ein:

```text
Installiere die Video-Effekte aus https://github.com/KenoMedien/claude-video-effects. Lies dafür die README im Repo und führ den Abschnitt „Installation für Claude“ aus. Prüf danach selbst, dass alles läuft, und sag mir, wenn du etwas von mir brauchst.
```

## Installation für Claude

Diese Schritte führt Claude aus. Vor jeder Installation eines Programms (zum Beispiel ffmpeg) fragt
Claude den Nutzer.

1. Repo holen: `git clone https://github.com/KenoMedien/claude-video-effects.git ~/claude-video-effects`
   (Windows: `%USERPROFILE%\claude-video-effects`)
2. Im Repo-Ordner `npm install` ausführen.
3. Prüfen: `node -v` (ab 18), `ffmpeg -version`. Fehlt ffmpeg: Mac `brew install ffmpeg`,
   Windows `winget install ffmpeg`, Linux über den Paketmanager. Erst nach dem Ja des Nutzers.
4. Skill einrichten: `bash scripts/install-skill.sh`. Das kopiert `skill/` nach
   `~/.claude/skills/video-effects/` und trägt dort den Repo-Pfad ein. Windows ohne bash: die drei
   Dateien aus `skill/` nach `%USERPROFILE%\.claude\skills\video-effects\` kopieren und in allen dreien
   `{{REPO}}` durch den vollen Repo-Pfad ersetzen.
5. Gegenprobe: `npm run typecheck` muss ohne Fehler durchlaufen.
6. Dem Nutzer sagen: Die Effekte sind bereit. Falls Claude den Skill `video-effects` nicht sofort kennt,
   Claude Code einmal neu starten. Spracherkennung und Freistellung werden erst beim ersten Video geladen.

## So benutzt du es

1. **Aufnehmen.** Hochformat, ruhig stehen, gutes Licht. Sag die Effekte einfach im Video an, zum
   Beispiel: „Jetzt zerspringt das Bild wie Glas.“ oder „Hinter mir steht jetzt ein riesiges Wort.“
2. **Tipp:** Filme am Ende zwei Sekunden das leere Zimmer, ohne dich, Kamera nicht bewegen. Damit sehen
   „Text hinter mir“, „Schlagzeilen-Sturm“ und „Dolly Zoom“ am saubersten aus.
3. **Claude die Datei geben:**

   ```text
   Schneide mein Video rohvideo.mov im Hochformat. Setze Untertitel für jedes Wort und bau jeden Effekt genau an der Stelle ein, an der ich ihn nenne.
   ```

Claude zeigt dir vorher, welche Effekte wo landen. Am Ende liegt das fertige Video in `out/`. Mit
`npm run studio` siehst du es im Browser und kannst Stellen ändern lassen.

## Die 21 Effekte

| Nr. | Effekt | Was passiert |
|---|---|---|
| 01 | Green Screen | Studio-Grün hinter dir, dann öffnet sich ein Foto |
| 02 | Magazin-Cover | du als Titelbild, der Titel steht hinter deinem Kopf |
| 03 | Chat-Übernahme | dein Video schrumpft in eine Chat-Nachricht |
| 04 | Wachstumskurve | eine leuchtende Kurve schießt hinter dir nach oben |
| 05 | Glasbruch | das Bild bekommt Risse und zerfällt in Scherben |
| 06 | Orbit | Symbole kreisen um deinen Kopf, hinten hinter dir |
| 07 | Dolly Zoom | du bleibst gleich groß, der Raum zieht sich zusammen |
| 08 | Paper Cutout | du als Papierausschnitt mit weißem Rand |
| 09 | Schlagzeilen-Sturm | Eilmeldungen fliegen ein und laufen hinter dir |
| 10 | Handy-Mockup | dein Video schrumpft in ein Handy |
| 11 | Snap Zoom | blitzschneller Sprung auf dein Gesicht |
| 12 | Studio-Reveal | im dunklen Studio geht das Licht an |
| 13 | Liquid Glass | eine Glaslinse gleitet übers Bild |
| 14 | Zoom-Portal | die Kamera fliegt in einen Kreis hinein |
| 15 | B-Roll-Overlay | ein Schnittprogramm fährt herauf, dein Video läuft darin |
| 16 | Text hinter mir | ein riesiges Wort steht hinter dir |
| 17 | Digital Zoom | Kamerasucher mit REC, dann Zoom |
| 18 | Rahmen-Ausbruch | du steigst aus deinem eigenen Bild |
| 19 | Zoom-Schnitt | unscharfer Zoom hinein und wieder heraus |
| 20 | Häkchen-Pop | Pillen mit Haken neben deinem Kopf |
| 21 | Checkliste | alle Effekte werden abgehakt |

Dir fehlt ein Effekt? Beschreib ihn Claude in einem Satz. Die 21 Effekte zeigen Claude, wie so etwas
gebaut wird. Farben und Texte lassen sich ändern, Einzelheiten in `skill/katalog.md`.

## Was im Repo liegt

| Ordner | Inhalt |
|---|---|
| `skill/` | die Anleitung für Claude: Ablauf, Effekt-Katalog, Freistellung |
| `src/effects/` | die 21 Effekte (Remotion, TypeScript) und die Farben |
| `src/project.ts` | die eine Datei, die Claude pro Video ausfüllt |
| `scripts/` | Spracherkennung, Freistellung, Standbilder, Skill-Installation |
| `public/` | hier landen dein Video und die Zwischendateien; sie bleiben auf deinem Rechner |

## Lizenzen

- **Dieses Repo:** MIT, siehe [LICENSE](LICENSE).
- **Remotion** (rendert die Videos) hat eine eigene Lizenz: kostenlos für Einzelpersonen, Firmen bis
  drei Mitarbeitende und gemeinnützige Organisationen, größere Firmen brauchen eine Firmenlizenz.
  Einzelheiten: [remotion.dev/license](https://www.remotion.dev/license).
- **Montserrat** (Schrift): SIL Open Font License 1.1, siehe `public/fonts/OFL-Montserrat.txt`.
- **whisper.cpp** (Spracherkennung): MIT. Wird beim ersten Abtippen geladen und ist nicht Teil dieses Repos.
- **RobustVideoMatting** (Freistellung): GPL-3.0. Wird mit `scripts/setup-rvm.sh` geladen und ist nicht
  Teil dieses Repos.

Gebaut von Robin Csipke. Mehr Videos zu Claude und KI: Instagram und TikTok `@robincsipke`.
