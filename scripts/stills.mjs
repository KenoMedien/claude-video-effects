// Render several stills of the composition with a single bundle, to check effects before the full render.
// usage: node scripts/stills.mjs <outDir> <sec,sec,...> [scale=0.5]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const [outDir, secs, scaleArg] = process.argv.slice(2);
if (!outDir || !secs) {
  console.error("usage: node scripts/stills.mjs <outDir> <sec,sec,...> [scale=0.5]");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const composition = await selectComposition({ serveUrl, id: "EffectsVideo" });
for (const s of secs.split(",").map(Number)) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const output = path.join(outDir, `still-${s.toFixed(2)}.png`);
  await renderStill({ composition, serveUrl, output, frame, scale: Number(scaleArg ?? 0.5) });
  console.log(output);
}
