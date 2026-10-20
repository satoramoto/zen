// Display's measuring in Svelte, over the framework-free `fit.ts`: the `displayFit` action on the
// frame (`use:displayFit={key}`, fitting again when the key changes) and `measureWide`, the auto
// form's width (`{@attach wide.attach}` on the root).
import type { Action } from 'svelte/action';
import { bindFit, observeWide } from './fit';

/** Fits the hero's frame; `key` changes whenever what it measures may have changed. */
export const displayFit: Action<HTMLElement, string> = (node, key) => {
  const binding = bindFit(node);
  let current = key;
  return {
    update(next) {
      if (next === current) return;
      current = next;
      binding.refit();
    },
    destroy: () => binding.destroy(),
  };
};

/**
 * Whether the attached element is wide enough for `full`, measured only while `on()`. Reactive;
 * call it while a component initialises.
 */
export function measureWide(on: () => boolean): { readonly current: boolean; attach: (node: HTMLElement) => (() => void) | undefined } {
  let wide = $state(false);
  return {
    get current() {
      return wide;
    },
    attach(node) {
      if (!on()) return;
      return observeWide(node, (next) => (wide = next));
    },
  };
}
