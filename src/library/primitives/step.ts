// Spacing steps: the scale's six spacing variables as numbers a prop can name. 0 is no gap; N reads
// `var(--space-N)` (the contract's --space-1 … --space-6).

/** A spacing step: 0 = no gap, 1–6 = `var(--space-1)` … `var(--space-6)`. */
export type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Every step, smallest first. */
export const STEPS = [0, 1, 2, 3, 4, 5, 6] as const;

/** The CSS length for a step: `0` or `var(--space-N)`. */
export function stepVar(step: Step): string {
  return step === 0 ? '0' : `var(--space-${step})`;
}
