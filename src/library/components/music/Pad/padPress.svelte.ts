// The Pad's press and tooltip as a Svelte action (`use:padPress={params}`, or through a component
// with `{@attach fromAction(padPress, () => params)}`). The logic is the framework-free `padPress.ts`.
import type { Action } from 'svelte/action';
import { bindPad, type PadParams } from './padPress';

export const padPress: Action<HTMLElement, PadParams> = (node, params) => {
  const binding = bindPad(node, params ?? {});
  return { update: (next) => binding.update(next ?? {}), destroy: () => binding.destroy() };
};
