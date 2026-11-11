export const PIN_STEP_VH = 60;

/**
 * Pin distance for a stepped, scrubbed sequence.
 *
 * Five steps resolve to `+=300%`, three steps to `+=180%`. The floor keeps a
 * short sequence from becoming a cramped pin, while the per-step term keeps
 * the scroll budget proportional to the number of cards. `+=300%` is the
 * ceiling the design language was tuned against.
 */
export function pinEndForSteps(stepCount: number, perStepVh = PIN_STEP_VH) {
  const steps = Math.max(1, Math.round(stepCount));
  return `+=${Math.max(180, steps * perStepVh)}%`;
}
