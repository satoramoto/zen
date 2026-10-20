// The popover's open/close handling in Svelte: the `dismiss` action (`use:dismiss={params}`, or
// `{@attach fromAction(dismiss, () => params)}` through a component) and `createFocusReturn`, fed
// from an `$effect`. The logic is the framework-free `popover.ts`.
import type { Action } from 'svelte/action';
import { bindDismiss, type DismissParams } from './popover';

export { createFocusReturn, type DismissParams } from './popover';

export const dismiss: Action<HTMLElement, DismissParams> = (node, params) => {
  const binding = bindDismiss(node, params ?? { id: '' });
  return { update: (next) => binding.update(next ?? { id: '' }), destroy: () => binding.destroy() };
};
