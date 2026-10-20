// The tooltip binding as a Svelte action (`use:tip={params}`, or through a component with
// `{@attach fromAction(tip, () => params)}`). The logic is the framework-free `tip.ts`.
import type { Action } from 'svelte/action';
import { bindTip, type TipParams } from './tip';

export const tip: Action<HTMLElement, TipParams> = (node, params) => {
  const binding = bindTip(node, params ?? {});
  return { update: (next) => binding.update(next ?? {}), destroy: () => binding.destroy() };
};
