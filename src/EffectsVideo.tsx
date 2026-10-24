import type { Caption } from "@remotion/captions";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "./Captions";
import { EffectLayer, type EffectsSpec } from "./effects/effects";
import { DEFAULT_THEME, ThemeProvider, type Theme } from "./effects/theme";
import "./fonts";

export type EffectsVideoProps = {
  /** Video in public/, already cut and in portrait format. */
  video: string;
  /** Transparent cut-out (WebM with alpha) of the same video in public/, needed by the "Frei" effects. */
  cutout?: string;
  /** Word timestamps in public/ (JSON, Caption[] from scripts/transcribe.mjs). Loaded in Root.tsx. */
  captionsFile?: string;
  captions: Caption[];
  showCaptions: boolean;
  /** Top edge of the captions in frame pixels; put them under the chin. */
  captionsTop: number;
  effects: EffectsSpec;
  theme: Partial<Theme>;
};

const Placeholder: React.FC = () => (
  <AbsoluteFill style={{ background: "#0a0a0c", color: "#f4f2ee", fontFamily: DEFAULT_THEME.font, alignItems: "center", justifyContent: "center", textAlign: "center", padding: 120, fontSize: 48, lineHeight: 1.3 }}>
    Noch kein Video eingetragen. Leg dein Video in public/ und trag den Dateinamen in src/project.ts ein.
  </AbsoluteFill>
);

export const EffectsVideo: React.FC<EffectsVideoProps> = ({ video, cutout, captions, showCaptions, captionsTop, effects, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  if (!video) return <Placeholder />;
  return (
    <ThemeProvider value={{ ...DEFAULT_THEME, ...theme }}>
      <AbsoluteFill style={{ background: "#000" }}>
        <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <EffectLayer spec={effects} seconds={seconds} source={video} cutout={cutout} />
        {showCaptions && captions.length > 0 ? <Captions captions={captions} seconds={seconds} top={captionsTop} /> : null}
      </AbsoluteFill>
    </ThemeProvider>
  );
};
