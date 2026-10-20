/**
 * The metronome popover's open/close handling, framework-free. `useDismiss`/`useFocusReturn`
 * (React, `usePopover.ts`) and the `dismiss` action/`focusReturn` (Svelte, `popover.svelte.ts`) wrap
 * these; neither renderer holds any of this logic.
 *
 * - `bindDismiss(node, params)`: while bound, Esc (caught in the capture phase, so the window's own
 *   shortcuts never see it) and a pointer press outside `node` call `onClose`. A press on the opener
 *   (`[aria-controls=<id>]`) is left to the opener, which toggles it itself.
 * - `createFocusReturn(getBox)`: fed the open state on every change; when the popover closes with
 *   focus fallen to the page, it gives focus back to the opener's button inside `getBox()`.
 */
export interface DismissParams {
  /** The popover's id: a press on `[aria-controls=<id>]` (the opener) doesn't close it. */
  id: string;
  /** Called on Esc or a press outside. */
  onClose?: () => void;
}

export interface DismissBinding {
  update: (params: DismissParams) => void;
  destroy: () => void;
}

/** Binds Esc and press-outside to `node`; `update` swaps the params (the latest `onClose` is called). */
export function bindDismiss(node: HTMLElement, initial: DismissParams): DismissBinding {
  let params = initial;
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    // In the capture phase, so the window's own key handlers never see this Esc.
    event.stopPropagation();
    event.preventDefault();
    params.onClose?.();
  };
  const pointerdown = (event: PointerEvent) => {
    const target = event.target as Node | null;
    if (!target || node.contains(target)) return;
    if (target instanceof Element && target.closest(`[aria-controls="${params.id}"]`)) return;
    params.onClose?.();
  };
  window.addEventListener('keydown', keydown, true);
  window.addEventListener('pointerdown', pointerdown, true);
  return {
    update: (next) => {
      params = next;
    },
    destroy: () => {
      window.removeEventListener('keydown', keydown, true);
      window.removeEventListener('pointerdown', pointerdown, true);
    },
  };
}

/** Returns a function to call with the open state whenever it changes (and once at first). */
export function createFocusReturn(getBox: () => HTMLElement | null | undefined): (open: boolean) => void {
  let wasOpen: boolean | null = null;
  return (open) => {
    if (wasOpen === true && !open) {
      const active = document.activeElement;
      if (active === null || active === document.body) getBox()?.querySelector('button')?.focus();
    }
    wasOpen = open;
  };
}
