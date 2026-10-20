// Focus trapping for dialogs as a React hook, for an app's own overlays that aren't a Modal (and for
// Popover's helpers). The behaviour is the framework-free `focusTrap` store (`dialog.ts`); this is
// the thin wrapper `src/library/index.ts` exports.
import { useEffect, type RefObject } from 'react';
import { bindFocusTrap } from './dialog';

export { FOCUSABLE, focusables, isTopTrap, leavesKeys, pushTrap, removeTrap, wrapFocus } from './dialog';

/**
 * Keeps keyboard focus inside the element `ref` points at while it is mounted and the topmost trap:
 * `bindFocusTrap` (`dialog.ts`) on it from mount to unmount.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const binding = bindFocusTrap(root);
    return () => binding.destroy();
  }, [ref]);
}
