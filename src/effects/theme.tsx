import { createContext, useContext } from "react";

export const WIDTH = 1080;
export const HEIGHT = 1920;

/** All colours and fonts of the effects. Override any of them in `src/project.ts`. */
export type Theme = {
  /** Effect numbers, ON AIR, REC dot, masthead. */
  accent: string;
  /** Dark text and dark surfaces. */
  ink: string;
  /** Light surfaces and small dots. */
  paper: string;
  /** Warm background (paper cut-out) and the cover badge. */
  gold: string;
  /** Glow colour (portal ring, growth curve). */
  glow: string;
  /** Deep colour for the word behind you, orbit details and the curve background. */
  deep: string;
  /** Check marks. */
  success: string;
  /** Studio green of the green screen. */
  chroma: string;
  /** Light backdrop, top left. */
  light: string;
  /** Light backdrop, bottom right. */
  sand: string;
  font: string;
  mono: string;
};

export const DEFAULT_THEME: Theme = {
  accent: "#ff3b42",
  ink: "#0a0a0c",
  paper: "#f4f2ee",
  gold: "#d8b46a",
  glow: "#4ec9dd",
  deep: "#0f4c57",
  success: "#4ea36b",
  chroma: "#13b54a",
  light: "#f7f5f0",
  sand: "#ece5d6",
  font: 'Montserrat, "SF Pro Display", system-ui, sans-serif',
  mono: '"SF Mono", "Roboto Mono", ui-monospace, monospace',
};

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

export const ThemeProvider = ThemeContext.Provider;

export const useTheme = () => useContext(ThemeContext);

/** Hex colour (#rrggbb) as rgba() with the given alpha. */
export const rgba = (hex: string, alpha: number) => {
  const value = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
};
