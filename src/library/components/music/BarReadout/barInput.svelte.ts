// The row's input as a Svelte action (`use:barInput={params}`, or through a component with
// `{@attach fromAction(barInput, () => params)}`). The logic is the framework-free `barInput.ts`.
import type { Action } from 'svelte/action';
import { bindBarInput, type BarBindParams } from './barInput';

export const barInput: Action<HTMLElement, BarBindParams> = (node, params) => {
  const binding = bindBarInput(node, params);
  return { update: (next) => binding.update(next), destroy: () => binding.destroy() };
};
