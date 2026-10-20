import { useLayoutEffect, useState, type RefObject } from 'react';
import { bindFit, observeWide } from './fit';

/** Fits the hero's frame (`fit.ts`), again whenever `key` changes. */
export function useFit(frame: RefObject<HTMLElement | null>, key: string): void {
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const binding = bindFit(el);
    return () => binding.destroy();
  }, [frame, key]);
}

/** Whether `root` is wide enough for `full` (`fit.ts`'s `observeWide`); only watches while `on`. */
export function useWide(root: RefObject<HTMLElement | null>, on: boolean): boolean {
  const [wide, setWide] = useState(false);
  useLayoutEffect(() => {
    const el = root.current;
    if (!on || !el) return;
    return observeWide(el, setWide);
  }, [root, on]);
  return wide;
}
