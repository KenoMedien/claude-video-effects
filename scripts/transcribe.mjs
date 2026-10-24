// Word timestamps for captions and effect timing.
// usage: node scripts/transcribe.mjs <video in public/> [language=de] [model=medium]
// Writes public/<name>-captions.json (Caption[] from @remotion/captions).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } from "@remotion/install-whisper-cpp";

const [input, language = "de", model = "medium"] = process.argv.slice(2);
if (!input) {
  console.error("usage: node scripts/transcribe.mjs <video in public/> [language=de] [model=medium]");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.isAbsolute(input) ? input : path.join(root, "public", input);
if (!fs.existsSync(source)) {
  console.error(`Video not found: ${source}`);
  process.exit(1);
}

// 1.5.5 builds without cmake on macOS and Linux and has prebuilt binaries for Windows.
const version = "1.5.5";
const whisperPath = path.join(root, "whisper.cpp");
const name = path.basename(source, path.extname(source));
const wav = path.join(root, ".cache", `${name}.wav`);
fs.mkdirSync(path.dirname(wav), { recursive: true });

execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", source, "-vn", "-ar", "16000", "-ac", "1", wav], { stdio: "inherit" });
await installWhisperCpp({ to: whisperPath, version });
await downloadWhisperModel({ model, folder: whisperPath });

const whisperCppOutput = await transcribe({
  inputPath: wav,
  whisperPath,
  whisperCppVersion: version,
  model,
  language,
  tokenLevelTimestamps: true,
  splitOnWord: true,
});
const { captions } = toCaptions({ whisperCppOutput });

const out = path.join(root, "public", `${name}-captions.json`);
fs.writeFileSync(out, JSON.stringify(captions, null, 2));
console.log(`${captions.length} words -> ${out}`);
