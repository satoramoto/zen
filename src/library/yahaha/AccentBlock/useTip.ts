import { useEffect, type RefObject } from 'react';
import { bindTip, type TipParams } from './tip';

/** Binds the tooltip hook (`tip.ts`) to `ref`'s element, rebinding when the key, hook or `enabled` changes. */
export function useTip(ref: RefObject<HTMLElement | null>, { tip, tipAction, enabled }: TipParams): void {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const binding = bindTip(node, { tip, tipAction, enabled });
    return () => binding.destroy();
  }, [ref, tip, tipAction, enabled]);
}
