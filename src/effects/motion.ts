import { Easing } from "remotion";

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
// The two halves of a power4 in-out curve, mirrored so the speed matches on both sides of a cut.
export const EASE_IN_POW4 = Easing.bezier(0.895, 0.03, 0.685, 0.22);
export const EASE_OUT_POW4 = Easing.bezier(0.165, 0.84, 0.44, 1);
export const EASE_SLAM = Easing.bezier(0.6, 0, 0.1, 1);
