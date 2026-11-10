// Hover intent's open/close timing, framework-free: a store (the Svelte store contract,
// `subscribe`) of whether a hover-opened popover is open. React's `useHoverIntent` (Popover.tsx) is a
// thin wrapper; in Svelte, `createHoverIntent()` is used as is (`$intent` is the open state).

/** Pointer handlers for one half of a hover intent (the trigger, or the panel). Only `pointerType`
 *  is read, so React's synthetic events and native ones both do. */
export interface HoverPanel {
  onPointerEnter(e: { pointerType: string }): void;
  onPointerLeave(e: { pointerType: string }): void;
}

export interface HoverIntentOptions {
  /** How long a mouse rests on the trigger before it opens, in ms. Default 350. */
  openDelay?: number;
  /** How long after the mouse leaves trigger and panel before it closes, in ms. Default 200. */
  closeDelay?: number;
}

export interface HoverIntentStore {
  /** Whether it is open now. */
  readonly open: boolean;
  /** Called with the open state now and on every change; returns the unsubscribe. */
  subscribe(run: (open: boolean) => void): () => void;
  /** Open or close now, cancelling any pending delay (a click toggles with `setOpen(o => !o)`). */
  setOpen(open: boolean | ((open: boolean) => boolean)): void;
  /** New delays, for the next hover. */
  configure(options: HoverIntentOptions): void;
  /** Spread on the trigger. */
  trigger: HoverPanel;
  /** The panel's half: a Popover's `hover`. */
  panel: HoverPanel;
  /** Cancels any pending delay (on unmount). */
  destroy(): void;
}

/**
 * Hover intent for a popover opened by resting on its trigger (a link preview, a peek): a mouse
 * that rests `openDelay` on the trigger opens it; leaving both trigger and panel for `closeDelay`
 * closes it, and coming back to either within the delay keeps it. Only a mouse hovers: touch and
 * pen events are ignored, so a tap goes to the trigger's own click. `setOpen` cancels any pending
 * delay, so a click or Escape wins over a hover in flight.
 */
export function createHoverIntent(options: HoverIntentOptions = {}): HoverIntentStore {
  let { openDelay = 350, closeDelay = 200 } = options;
  let open = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const runs = new Set<(open: boolean) => void>();
  const set = (to: boolean) => {
    if (to === open) return;
    open = to;
    for (const run of runs) run(open);
  };
  const stay = () => clearTimeout(timer);
  const later = (to: boolean, ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => set(to), ms);
  };
  const leave = (e: { pointerType: string }) => {
    if (e.pointerType === 'mouse') later(false, closeDelay);
  };
  return {
    get open() {
      return open;
    },
    subscribe(run) {
      runs.add(run);
      run(open);
      return () => runs.delete(run);
    },
    setOpen(to) {
      clearTimeout(timer);
      set(typeof to === 'function' ? to(open) : to);
    },
    configure(next) {
      openDelay = next.openDelay ?? 350;
      closeDelay = next.closeDelay ?? 200;
    },
    trigger: {
      // Back on the trigger while open: just cancel the close.
      onPointerEnter: (e) => {
        if (e.pointerType !== 'mouse') return;
        if (open) stay();
        else later(true, openDelay);
      },
      onPointerLeave: leave,
    },
    panel: {
      onPointerEnter: (e) => {
        if (e.pointerType === 'mouse') stay();
      },
      onPointerLeave: leave,
    },
    destroy: stay,
  };
}
