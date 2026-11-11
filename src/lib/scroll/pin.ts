export const PIN_STEP_VH = 60;

/**
 * Pin distance for a stepped, scrubbed sequence.
 *
 * Five steps resolve to `+=300%`, six steps to `+=360%` — 60vh of scroll per
 * milestone. The floor keeps a short sequence from becoming a cramped pin,
 * while the per-step term keeps the scroll budget proportional to the number
 * of cards so the visitor advances naturally through every single milestone
 * instead of getting trapped inside one. `+=300%` is the ceiling the design
 * language was tuned against.
 */
export function pinEndForSteps(stepCount: number, perStepVh = PIN_STEP_VH) {
  const steps = Math.max(1, Math.round(stepCount));
  return `+=${Math.max(180, steps * perStepVh)}%`;
}
