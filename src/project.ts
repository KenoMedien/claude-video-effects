import type { EffectsSpec } from "./effects/effects";
import type { Theme } from "./effects/theme";

/**
 * The one file to edit per video. All file names are relative to public/.
 * The full list of effects and their fields is in skill/catalog.md.
 */
export type Project = {
  video: string;
  cutout?: string;
  captionsFile?: string;
  showCaptions: boolean;
  captionsTop?: number;
  fps: number;
  durationInSeconds: number;
  theme: Partial<Theme>;
  effects: EffectsSpec;
};

export const PROJECT: Project = {
  video: "",
  showCaptions: true,
  fps: 30,
  durationInSeconds: 10,
  theme: {},
  effects: { total: 0, cues: [] },
};
