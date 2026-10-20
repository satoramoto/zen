import { useEffect, useRef, type RefObject } from 'react';
import { bindDismiss, createFocusReturn, type DismissBinding } from './popover';

// The popover's open/close handling is framework-free (`popover.ts`); these hooks bind it to React.

/** Esc and a press outside `ref`'s element call the latest `onClose` (`bindDismiss`). */
export function useDismiss(ref: RefObject<HTMLElement | null>, id: string, onClose: (() => void) | undefined): void {
  const close = useRef(onClose);
  close.current = onClose;
  const binding = useRef<DismissBinding | null>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    binding.current = bindDismiss(node, { id, onClose: () => close.current?.() });
    return () => {
      binding.current?.destroy();
      binding.current = null;
    };
  }, [ref, id]);
}

/** Gives focus back to the button inside `ref` when `open` turns false with focus on the page (`createFocusReturn`). */
export function useFocusReturn(ref: RefObject<HTMLElement | null>, open: boolean): void {
  const track = useRef<((open: boolean) => void) | null>(null);
  track.current ??= createFocusReturn(() => ref.current);
  useEffect(() => {
    track.current?.(open);
  }, [open]);
}
