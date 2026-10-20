import { useEffect, useRef, type RefObject } from 'react';
import { applyTip, type Binding } from './tempoGestures';
import type { TipAction } from './TempoReadout.model';

// The gestures are framework-free (`tempoGestures.ts`); these hooks bind them to React refs.

/** Binds `bind` to `ref`'s element once, and hands it the latest params after every render. */
export function useBinding<P>(ref: RefObject<HTMLElement | null>, bind: (node: HTMLElement, params: P) => Binding<P>, params: P): void {
  const binding = useRef<Binding<P> | null>(null);
  const latest = useRef(params);
  latest.current = params;
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    binding.current = bind(node, latest.current);
    return () => {
      binding.current?.destroy();
      binding.current = null;
    };
  }, [ref, bind]);
  useEffect(() => {
    binding.current?.update(params);
  });
}

/** Applies the app's tooltip action to `ref`'s element while `tipAction` is set; destroyed on unmount or key change. */
export function useTip(ref: RefObject<HTMLElement | null>, tipAction: TipAction | undefined, key: string): void {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    return applyTip(node, tipAction, key);
  }, [ref, tipAction, key]);
}
