/**
 * Small vibrations that confirm an action on phones.
 *
 * Uses the Vibration API, which Android browsers support and iOS Safari does
 * not — there it is a silent no-op, never an error. Skipped when the user asks
 * for reduced motion, since that preference covers "don't jostle me" too.
 *
 * Patterns are deliberately short: a confirmation should be felt, not noticed.
 */

export type HapticKind = "tap" | "success" | "error";

const PATTERNS: Record<HapticKind, number | number[]> = {
  /** A button press: search submitted, item saved. */
  tap: 8,
  /** Something finished well: results arrived. Two quick pulses. */
  success: [10, 50, 14],
  /** Something went wrong. Longer and heavier, so it reads differently. */
  error: [28, 60, 28],
};

export function haptic(kind: HapticKind = "tap"): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    // Some browsers throw if vibration is blocked by policy; it's never worth surfacing.
  }
}
