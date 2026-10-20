// The long press as a Svelte action (`use:longPress={params}`, or through a component with
// `{@attach fromAction(longPress, () => params)}`). The logic is the framework-free `longPress.ts`.
import type { Action } from 'svelte/action';
import { bindLongPress, type LongPressParams } from './longPress';

export const longPress: Action<HTMLElement, LongPressParams> = (node, params) => {
  const binding = bindLongPress(node, params ?? {});
  return { update: (next) => binding.update(next ?? {}), destroy: () => binding.destroy() };
};
