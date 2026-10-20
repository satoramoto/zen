import { useEffect, type RefObject } from 'react';
import { bindTip, type TipParams } from './tip';

/** Binds the tooltip hook (`tip.ts`) to `ref`'s element, rebinding when the key or the hook changes. */
export function useTip(ref: RefObject<HTMLElement | null>, { tip, tipAction }: TipParams): void {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const binding = bindTip(node, { tip, tipAction });
    return () => binding.destroy();
  }, [ref, tip, tipAction]);
}
