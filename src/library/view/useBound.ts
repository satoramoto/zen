// A bridge for components not yet drawn by `Tree`: a plain `bindX(node, params)` store bound to a
// React ref, so no store needs a per-component hook. `bridge.ts` (`actionOf`) is the Svelte twin.
import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { Bind } from './bridge';
import type { StoreBinding } from './stores';

/** Binds `bind` to `ref`'s element while it is mounted, with every render's `params`. */
export function useBound<P>(ref: RefObject<HTMLElement | null>, bind: Bind<P>, params: P): void {
  const binding = useRef<StoreBinding<P> | null>(null);
  const latest = useRef(params);
  latest.current = params;
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    binding.current = bind(node, latest.current);
    return () => {
      binding.current?.destroy?.();
      binding.current = null;
    };
  }, [ref, bind]);
  useLayoutEffect(() => {
    binding.current?.update?.(params);
  });
}
