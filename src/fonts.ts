import { continueRender, delayRender, staticFile } from "remotion";

const handle = delayRender("Loading fonts");

const montserrat = new FontFace("Montserrat", `url(${staticFile("fonts/Montserrat.ttf")}) format("truetype")`, {
  weight: "100 900",
  style: "normal",
});

montserrat
  .load()
  .then((font) => document.fonts.add(font))
  .catch((error: unknown) => {
    // Rendering goes on with the system fallback font instead of hanging.
    console.warn("Montserrat could not be loaded", error);
  })
  .finally(() => continueRender(handle));
