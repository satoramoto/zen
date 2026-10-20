import { useEffect, useRef, type RefObject } from 'react';
import { bindDialogEscape, closesOnKey } from './dialog';
import { useFocusTrap } from './focusTrap';

// Kept as a thin wrapper because `src/library/index.ts` exports it for an app's own overlays that
// aren't a Modal. Modal itself binds the `focusTrap` and `dialogEscape` stores (`dialog.ts`).
export { closesOnKey };

/**
 * The behaviour every dialog here shares, on the element `ref` points at (it takes
 * `tabIndex={-1}`): the `focusTrap` store (focus in, trapped, back to the opener on unmount) and the
 * `dialogEscape` store (Esc calls `onClose`, topmost dialog only), from `dialog.ts`.
 */
export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  useFocusTrap(ref);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const binding = bindDialogEscape(root, { onClose: () => close.current() });
    return () => binding.destroy();
  }, [ref]);
}
