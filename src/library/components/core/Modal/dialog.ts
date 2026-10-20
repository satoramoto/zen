// A dialog's keyboard behaviour, framework-free (focus trapping ported from visual[flow]'s
// app/src/focusTrap.ts). `src/library/view/stores.ts` registers `bindFocusTrap` as `focusTrap` and
// `bindDialogEscape` as `dialogEscape`; Modal's tree binds both on its dialog, in that order.
// `focusTrap.ts` and `useModal.ts` keep the React hooks over these for app overlays that aren't a Modal.

/** What Tab can land on inside a dialog. */
export const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

/**
 * Where Tab (or ⇧Tab, `back`) goes next among `items`, the dialog's focusable controls in order,
 * from `at` (what has focus now): round from the last to the first and back, so focus never leaves
 * the dialog. Null when the browser's own step stays inside, so it is left alone. With nothing
 * focusable, focus stays where it is (`at`, or the dialog itself, which the caller gives as `home`).
 */
export function wrapFocus<T>(items: readonly T[], at: T | null, back: boolean, home: T): T | null {
  if (!items.length) return at ?? home;
  const i = at === null ? -1 : items.indexOf(at);
  if (i < 0) return back ? items[items.length - 1] : items[0];
  if (back && i === 0) return items[items.length - 1];
  if (!back && i === items.length - 1) return items[0];
  return null;
}

/** The controls Tab can reach inside `root`, in document order, leaving out hidden and inert ones. */
export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest('[inert], [hidden], [aria-hidden="true"]') && el.getClientRects().length > 0,
  );
}

/**
 * The traps mounted now, oldest first. Only the last (topmost: a warning opened over a settings
 * sheet) acts on Tab, and only its Esc closes anything; the ones under it wait until it goes.
 */
const traps: object[] = [];

/** Put `trap` on top of the stack. */
export function pushTrap(trap: object): void {
  removeTrap(trap);
  traps.push(trap);
}

/** Take `trap` off the stack, wherever it is in it. */
export function removeTrap(trap: object): void {
  const i = traps.indexOf(trap);
  if (i >= 0) traps.splice(i, 1);
}

/** Whether `trap` is the topmost trap: the one Tab and Esc are for. */
export const isTopTrap = (trap: object | null): boolean => trap !== null && traps.length > 0 && traps[traps.length - 1] === trap;

/**
 * Whether a trap on `root` leaves a key (Tab, Esc) from `active` (what has focus) alone: always
 * when it isn't the topmost trap (`top`), and, for a non-modal one (a drawer that leaves the page
 * usable beside it), when focus is in another dialog beside it, such as a popover opened next to
 * the drawer.
 */
export function leavesKeys(root: HTMLElement, active: Element | null, top: boolean): boolean {
  if (!top) return true;
  if (root.getAttribute('aria-modal') === 'true' || !active || root.contains(active)) return false;
  return active.closest('[role="dialog"], [role="alertdialog"]') !== null;
}

/** `focusTrap` takes no params. */
export type FocusTrapParams = Record<string, never>;

/**
 * Keeps keyboard focus inside `node` while it is bound and the topmost trap (`isTopTrap`): focus
 * moves into it (to itself, which takes `tabindex="-1"`), Tab and ⇧Tab go round its controls, and
 * focus that escapes (a click behind a drawer with no scrim) is let be, but the next Tab comes back
 * in, unless (for a non-modal one) it went into another dialog beside it (`leavesKeys`). On
 * `destroy`, focus goes back to whatever had it before (the button that opened it), if that is
 * still in the page.
 */
export function bindFocusTrap(node: HTMLElement, _params: FocusTrapParams = {}): { update(params: FocusTrapParams): void; destroy(): void } {
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  pushTrap(node);
  if (!node.contains(document.activeElement)) node.focus();
  const key = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || e.defaultPrevented) return;
    if (leavesKeys(node, document.activeElement, isTopTrap(node))) return;
    const active =
      document.activeElement instanceof HTMLElement && node.contains(document.activeElement) && document.activeElement !== node
        ? document.activeElement
        : null;
    const to = wrapFocus(focusables(node), active, e.shiftKey, node);
    if (!to) return;
    e.preventDefault();
    to.focus();
  };
  // Capturing, on the window, so Tab from outside (focus that escaped) comes back in too.
  window.addEventListener('keydown', key, true);
  return {
    update: () => {},
    destroy: () => {
      window.removeEventListener('keydown', key, true);
      removeTrap(node);
      if (opener?.isConnected) opener.focus();
    },
  };
}

/**
 * Whether a key press closes the dialog: Esc, unless an open menu inside it (a control with
 * `aria-expanded="true"`) takes it to close itself first.
 */
export function closesOnKey(e: { key: string; target: EventTarget | null }): boolean {
  if (e.key !== 'Escape') return false;
  const t = e.target as { closest?: (selector: string) => unknown } | null;
  return !(typeof t?.closest === 'function' && t.closest('[aria-expanded="true"]') != null);
}

export interface DialogEscapeParams {
  /** Called on Esc (`closesOnKey`) while `node` is the topmost trap. */
  onClose?: () => void;
}

/**
 * Esc calls `onClose`, heard on the window while capturing so it reaches the dialog before anything
 * else on the page. Only the topmost trap hears it (bind `focusTrap` first, on the same element); a
 * non-modal one leaves it to another dialog beside it that has focus. `update` swaps the params
 * (the latest `onClose` is called).
 */
export function bindDialogEscape(node: HTMLElement, initial: DialogEscapeParams): { update(params: DialogEscapeParams): void; destroy(): void } {
  let params = initial;
  const key = (e: KeyboardEvent) => {
    if (leavesKeys(node, e.target instanceof Element ? e.target : null, isTopTrap(node))) return;
    if (!closesOnKey(e)) return;
    e.preventDefault();
    e.stopPropagation();
    params.onClose?.();
  };
  window.addEventListener('keydown', key, true);
  return {
    update: (next) => {
      params = next;
    },
    destroy: () => window.removeEventListener('keydown', key, true),
  };
}
