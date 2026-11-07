/** How firmly a claim stands, strongest first. */
export const STANDINGS = ['established', 'consequence', 'interpretation', 'conjecture', 'speculation'] as const;
export type Standing = (typeof STANDINGS)[number];
