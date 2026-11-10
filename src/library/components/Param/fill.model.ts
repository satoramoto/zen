import { fractionOf, type Param } from './param';

// The framework-free half of `fill.ts` (no React), so a view model and the Svelte entry can use it.

/**
 * Where a value's fill starts and how far it runs. A port of `@openflow/widgets` `controls/fill.ts`.
 * A control whose zero sits at the middle of its travel (pan, transpose, an EQ gain) fills from
 * there; everything else from `min`.
 */
export type FillOrigin = 'min' | 'center';

/** The custom properties a Param control sets on itself; each control's CSS declares them. */
export type ParamVars = Record<`--lib-param-${string}`, string | number>;

/** How far off the middle zero may sit and still count as the middle. */
const CENTERED = 0.1;

/** From the middle when zero is the middle, else from `min`. Straddling zero is not the test. */
export function defaultOrigin(param: Param): FillOrigin {
  if (param.min >= 0 || param.max <= 0) return 'min';
  return Math.abs(fractionOf(param, 0) - 0.5) <= CENTERED ? 'center' : 'min';
}

export function originFraction(param: Param, origin: FillOrigin): number {
  return origin === 'center' ? fractionOf(param, 0) : 0;
}

/** `--lib-param-fraction`, `--lib-param-fill-start` and `--lib-param-fill-size`, all 0–1. */
export function fillFrom(param: Param, origin: FillOrigin, fraction: number): ParamVars {
  const from = originFraction(param, origin);
  return {
    '--lib-param-fraction': fraction,
    '--lib-param-fill-start': Math.min(fraction, from),
    '--lib-param-fill-size': Math.abs(fraction - from),
  };
}

/** The `data-hint` attribute a control spreads on its root; absent when there is no hint. */
export function hintAttribute(hint: string | undefined): Record<string, string> {
  return hint === undefined ? {} : { 'data-hint': hint };
}
