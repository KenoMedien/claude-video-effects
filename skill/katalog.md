# Effekt-Katalog

Code: `{{REPO}}/src/effects/effects.tsx`. Eingetragen werden die Effekte in `{{REPO}}/src/project.ts`
unter `effects`. Das Bild ist immer 1080 × 1920 Bildpunkte, Zeiten sind Sekunden im fertig
geschnittenen Video.

## Aufruf

```ts
effects: {
  total: 3,
  cues: [
    { kind: "greenscreen", from: 2.4, to: 4.6, nr: 1, name: "Green Screen", at: 0.6, src: "stadt.jpg" },
    { kind: "glas", from: 4.6, to: 6.2, nr: 2, name: "Glasbruch", at: 0.4, face: { x: 560, y: 840 }, src: "mein-video-glas.jpg" },
    { kind: "text", from: 6.2, to: 8.9, nr: 3, name: "Text hinter mir", at: 0.3, word: "KI", plate: "zimmer.jpg" },
  ],
},
```

| Feld | Bedeutung |
|---|---|
| `kind` | Effekt aus der Tabelle unten |
| `from`, `to` | Fenster in Sekunden; der Effekt deckt das ganze Fenster ab |
| `nr`, `name` | Kopfzeile oben (rote Nummer, Name, Fortschrittsstriche bis `total`). `nr: 0` = ohne Kopfzeile |
| `at` | Zündwort in Sekunden ab `from` |
| `face` | Gesichtsmitte in Bildpunkten, Standard `{ x: 540, y: 820 }`. Immer messen und bei jedem Cue setzen: Zoompunkte und die Lage von Texten (Vorschau, Magazin-Spalte, Häkchen) richten sich danach |
| `src` | Bild in `public/` (Foto, leeres Zimmer, Standbild) |
| `plate` | leeres Zimmer in `public/`, hinter der Freistellung statt des Kamerabilds |
| `word` | `text`: das Wort hinter dir (Standard „WOW“, lange Wörter werden kleiner). `magazin`: Titel (Standard „COVER“). `checkliste`: Schlusszeile |
| `lines` | Textzeilen, je nach Effekt (siehe Tabelle) |
| `prompt` | `chat`: die Nachricht in der Sprechblase |
| `badge` | `magazin`: Text im runden Aufkleber (Standard „NEU“). `chat`: kleines Schild neben dem Namen |
| `avatar` | `handy`: Profilbild in `public/`. Ohne Bild steht ein farbiger Kreis mit dem ersten Buchstaben |
| `handle` | `handy`: Kontoname (Standard „deinname“) |

Jeder Effekt läuft nur in seinem Fenster. Zwischen zwei Effekten bleibt die Kopfzeile des vorigen stehen.

## Die Effekte

„Frei“ heißt: braucht die Freistellung (`cutout` in `project.ts`, siehe [freistellung.md](freistellung.md)).
Ohne Freistellung laufen diese Effekte trotzdem, nur ohne den Trick, dass du vor etwas stehst.

| kind | Name | Was im Bild passiert | Zutaten | Texte |
|---|---|---|---|---|
| `vorschau` | (Einstieg) | alle Effektnamen poppen über dem Kopf auf | | `nr: 0`, Namen kommen aus den übrigen Cues |
| `greenscreen` | Green Screen | Studio-Grün hinter dir, auf `at` öffnet ein Kreis ein Foto | Frei, Foto `src` (Hochformat) | |
| `magazin` | Magazin-Cover | Cover-Shooting auf hellem Grund, Titel hinter dem Kopf, Textspalte, Aufkleber, Strichcode | Frei | `word` Titel, `lines` [Dachzeile, große Zahl, Titel, Unterzeile], `badge` |
| `chat` | Chat-Übernahme | Bild schrumpft in den Anhang einer Chat-Nachricht, Antwort „Mach ich.“ mit drei Haken | | `prompt`, `lines` drei Schritte, `badge` |
| `kurve` | Wachstumskurve | du vor dunklem Raster, eine leuchtende Kurve schießt hinter dir nach oben | Frei | `lines` [unten, oben]; keine erfundenen Zahlen |
| `glas` | Glasbruch | Risse über einem Standbild, dann fallen 84 Scherben, darunter läuft das Video | Standbild `src` | `at` ≈ 0,4 |
| `orbit` | Orbit | sechs Symbole kreisen auf Kopfhöhe, hinten hinter dir | Frei, `face` | |
| `dolly` | Dolly Zoom | du bleibst gleich groß, das leere Zimmer zieht sich zusammen | Frei, leeres Zimmer `src` oder `plate`, `face` | |
| `papier` | Paper Cutout | goldene Fläche mit Papierkorn, du mit weißem Rand, Stern, Kreis, Balken | Frei | |
| `schlagzeilen` | Schlagzeilen-Sturm | fünf Eilmeldungs-Bänder fliegen ein und laufen hinter dir | Frei, besser mit `plate` | `lines` bis zu fünf Schlagzeilen |
| `handy` | Handy-Mockup | Bild schrumpft in ein Handy mit Reels-Oberfläche | | `handle`, `avatar` |
| `snap` | Snap Zoom | Sprung auf 1,62-fach in 0,13 s | `face` als Zoompunkt | |
| `studio` | Studio-Reveal | dunkles Studio, auf `at` flackern die Lampen an, ON AIR leuchtet | Frei, Studiofoto `src` | `at` auf „Licht“ |
| `liquid` | Liquid Glass | eine Glaslinse mit Verzerrung gleitet übers Gesicht | `face` | |
| `portal` | Zoom-Portal | Kreis mit Live-Bild oben links, die Kamera fliegt hinein | | `at` auf das Wort |
| `broll` | B-Roll-Overlay | ein Schnittprogramm fährt herauf, dein Video läuft im Vorschaufenster, ein Clip fällt auf die Spur | | `at` auf „B-Roll“ |
| `text` | Text hinter mir | riesiges Wort hinter dir, du bewegst dich davor | Frei, `plate` | `word` |
| `sucher` | Digital Zoom | Kamerasucher mit REC, Zeitcode, Zoom 1,0x → 2,0x | `face` | `at` auf das Wort, Zoom 0,96 s später |
| `rahmen` | Rahmen-Ausbruch | das Bild wird eine schräge Karte, dein Kopf steigt über die Oberkante | Frei, `face` | |
| `zoomschnitt` | Zoom-Schnitt | unscharfer Zoom hinein, Blitz, wieder heraus | `face` | |
| `haekchen` | Häkchen-Pop | bis zu vier Pillen mit Haken neben dem Kopf | | `lines` |
| `checkliste` | Checkliste | alle nummerierten Effekte werden abgehakt, ein Zähler läuft mit | | `word` Schlusszeile |

## Farben

`theme` in `project.ts` überschreibt einzelne Farben, zum Beispiel
`theme: { accent: "#7c3aed", deep: "#1e1b4b" }`. Alle Felder mit Erklärung stehen in
`src/effects/theme.tsx`. Schrift: Montserrat liegt bei (`public/fonts/`), eine andere Schrift über
`theme.font` und eine eigene `FontFace` in `src/fonts.ts`.

## Verzerrungsbild für `liquid`

Liegt fertig als `public/lens-map.png`. Neu erzeugen (400 × 400, Rot- und Grünkanal schieben zum Rand
hin nach innen):

```bash
ffmpeg -f lavfi -i "color=c=black:s=400x400,format=rgb24" -frames:v 1 -vf "geq=r='clip(128-127*((X-200)/200)*pow(min(hypot(X-200,Y-200)/200,1),2)*lt(hypot(X-200,Y-200),200),0,255)':g='clip(128-127*((Y-200)/200)*pow(min(hypot(X-200,Y-200)/200,1),2)*lt(hypot(X-200,Y-200),200),0,255)':b='128'" public/lens-map.png
```
