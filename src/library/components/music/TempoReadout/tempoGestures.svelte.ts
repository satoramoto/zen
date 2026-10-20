// TempoReadout's gestures as Svelte actions (`use:tempoNumber={params}`, or through a component
// with `{@attach fromAction(tempoNumber, () => params)}`). The logic is the framework-free `tempoGestures.ts`.
import type { Action } from 'svelte/action';
import { bindTempoNumber, bindTempoStep, type TempoNumberParams, type TempoStepParams } from './tempoGestures';

export const tempoNumber: Action<HTMLElement, TempoNumberParams> = (node, params) => {
  const binding = bindTempoNumber(node, params);
  return { update: (next) => binding.update(next), destroy: () => binding.destroy() };
};

export const tempoStep: Action<HTMLElement, TempoStepParams> = (node, params) => {
  const binding = bindTempoStep(node, params ?? {});
  return { update: (next) => binding.update(next ?? {}), destroy: () => binding.destroy() };
};
