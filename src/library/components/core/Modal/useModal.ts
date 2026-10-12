import { useEffect, useRef, type RefObject } from 'react';
import { isTopTrap, leavesKeys, useFocusTrap } from './focusTrap';

/**
 * Whether a key press closes the dialog: Esc, unless an open menu inside it (a control with
 * `aria-expanded="true"`) takes it to close itself first.
 */
export function closesOnKey(e: { key: string; target: EventTarget | null }): boolean {
  if (e.key !== 'Escape') return false;
  const t = e.target as { closest?: (selector: string) => unknown } | null;
  return !(typeof t?.closest === 'function' && t.closest('[aria-expanded="true"]') != null);
}

/**
 * The behaviour every dialog here shares, on the element `ref` points at (it takes
 * `tabIndex={-1}`): focus moves in on mount and is trapped there (`useFocusTrap`), goes back to the
 * opener on unmount, and Esc calls `onClose`, heard on the window while capturing so it reaches the
 * dialog before anything else on the page. Only the topmost dialog hears Tab and Esc; a non-modal
 * one leaves them to another dialog beside it that has focus.
 */
export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  useFocusTrap(ref);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const root = ref.current;
      if (!root || leavesKeys(root, e.target instanceof Element ? e.target : null, isTopTrap(root))) return;
      if (!closesOnKey(e)) return;
      e.preventDefault();
      e.stopPropagation();
      close.current();
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [ref]);
}
