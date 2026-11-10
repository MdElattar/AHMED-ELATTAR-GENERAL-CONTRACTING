/**
 * Shared WebGL budget for every procedural scene.
 *
 * Rendering is fill-rate bound on mobile GPUs, so the device-pixel-ratio
 * ceiling is hard-capped at 2 and each scene opts into a lower ceiling. The
 * clamp exists so a future scene can never accidentally request a 3x buffer
 * and tank the frame budget.
 */
export const MAX_DPR = 2;

export function dprRange(max: number): [number, number] {
  return [1, Math.min(MAX_DPR, Math.max(1, max))];
}

export const SCENE_DPR = {
  hero: dprRange(1.7),
  crane: dprRange(1.6),
  fleet: dprRange(1.55),
} as const;

/** Shared performance hints for every `Canvas`. */
export const SCENE_GL = {
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
  stencil: false,
  depth: true,
} as const;

export const SCENE_PERFORMANCE = {
  min: 0.5,
  max: 1,
  debounce: 200,
} as const;
