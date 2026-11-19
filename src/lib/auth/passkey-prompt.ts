/**
 * Non-intrusive enrollment cadence. The reminder is offered on the first
 * successful sign-in without a passkey, then at most once every four sign-ins
 * while it keeps being skipped. All state lives on the user record so it
 * survives browser changes; the session merely carries the decision.
 */
export const PASSKEY_PROMPT_INTERVAL = 4;

/** `passkeyReminders` counts sign-ins since the reminder was last shown. */
export function isPasskeyPromptDue(reminders: number | undefined): boolean {
  const count = Number.isFinite(reminders) ? Math.max(0, Math.floor(reminders!)) : 0;
  return count === 0 || count >= PASSKEY_PROMPT_INTERVAL;
}

/** Returns the persisted counter after a sign-in that showed (or skipped) a prompt. */
export function advancePasskeyReminder(reminders: number | undefined, prompted: boolean): number {
  const count = Number.isFinite(reminders) ? Math.max(0, Math.floor(reminders!)) : 0;
  if (prompted) return 1;
  return Math.min(count + 1, PASSKEY_PROMPT_INTERVAL);
}
