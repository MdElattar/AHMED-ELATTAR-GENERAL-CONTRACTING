import type { WebGLRenderer } from "three";

/**
 * Shared WebGL budget for every procedural scene.
 *
 * Rendering is fill-rate bound on mobile GPUs, so the device-pixel-ratio
 * ceiling is hard-capped at 2 and each scene opts into a lower ceiling. The
 * clamp exists so a future scene can never accidentally request a 3x buffer
 * and tank the frame budget.
 */
export const MAX_DPR = 2;

/**
 * Hard ceiling on how long a scene may take to create its renderer and paint.
 * If the GPU/driver stalls, the loader keeps the procedural fallback instead of
 * leaving the page waiting on a canvas that may never appear.
 */
export const SCENE_READY_TIMEOUT = 1500;

export function dprRange(max: number): [number, number] {
  return [1, Math.min(MAX_DPR, Math.max(1, max))];
}

export const SCENE_DPR = {
  hero: dprRange(1.7),
  crane: dprRange(1.6),
  fleet: dprRange(1.55),
} as const;

/**
 * Explicit device-pixel-ratio clamp. R3F's `dpr` prop already maps to this,
 * but calling it in `onCreated` guarantees the cap is applied before the first
 * frame even if a scene is remounted or a future R3F version changes the
 * `dpr` normalisation. A 3x phone buffer is the fastest way to lose 30fps.
 */
export function configureRenderer(gl: WebGLRenderer, sceneMaxDpr: number) {
  const deviceDpr =
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  gl.setPixelRatio(
    Math.max(1, Math.min(deviceDpr, MAX_DPR, sceneMaxDpr)),
  );
}

/**
 * Reveals a canvas only after it has had a chance to paint its first frame.
 * Without the two rAF hops the fallback can disappear one frame before the
 * renderer presents, producing a brief transparent flash on mount.
 */
export function revealAfterFirstFrame(onReady?: () => void) {
  if (!onReady) return;

  if (typeof requestAnimationFrame !== "function") {
    onReady();
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => onReady());
  });
}

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
