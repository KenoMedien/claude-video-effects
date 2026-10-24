import type { Caption } from "@remotion/captions";
import { Composition, staticFile } from "remotion";
import { EffectsVideo, type EffectsVideoProps } from "./EffectsVideo";
import { HEIGHT, WIDTH } from "./effects/theme";
import { PROJECT } from "./project";

const defaultProps: EffectsVideoProps = {
  video: PROJECT.video,
  cutout: PROJECT.cutout,
  captionsFile: PROJECT.captionsFile,
  captions: [],
  showCaptions: PROJECT.showCaptions,
  captionsTop: PROJECT.captionsTop ?? 1170,
  effects: PROJECT.effects,
  theme: PROJECT.theme,
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="EffectsVideo"
    component={EffectsVideo}
    width={WIDTH}
    height={HEIGHT}
    fps={PROJECT.fps}
    durationInFrames={Math.max(1, Math.round(PROJECT.durationInSeconds * PROJECT.fps))}
    defaultProps={defaultProps}
    calculateMetadata={async ({ props }) => {
      if (!props.captionsFile) return { props };
      const response = await fetch(staticFile(props.captionsFile));
      if (!response.ok) throw new Error(`Captions file public/${props.captionsFile} not found (HTTP ${response.status})`);
      const captions = (await response.json()) as Caption[];
      return { props: { ...props, captions } };
    }}
  />
);
