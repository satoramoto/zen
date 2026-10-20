// The measured width as a Svelte action (`use:fillWidth={{ on, onWidth }}`). The logic is the
// framework-free `fillWidth.ts`.
import type { Action } from 'svelte/action';
import { bindFillWidth, type FillWidthParams } from './fillWidth';

export const fillWidth: Action<HTMLElement, FillWidthParams> = (node, params) => {
  const binding = bindFillWidth(node, params);
  return { update: (next) => binding.update(next), destroy: () => binding.destroy() };
};
