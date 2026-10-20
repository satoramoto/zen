// The hero's fit as a Svelte action (`use:chordFit={params}`, or through a component with
// `{@attach fromAction(chordFit, () => params)}`): every update measures again. The logic is the
// framework-free `fit.ts`.
import type { Action } from 'svelte/action';
import { bindFit, type FitParams } from './fit';

/** `key` is any value whose change should measure again (the chord, its extension, held, size). */
export type ChordFitParams = FitParams & { key?: unknown };

export const chordFit: Action<HTMLElement, ChordFitParams> = (node, params) => {
  const binding = bindFit(node, params);
  return { update: (next) => binding.update(next), destroy: () => binding.destroy() };
};
