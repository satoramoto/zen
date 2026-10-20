/**
 * Button's repeat-while-held (`hold`), framework-free: a primary pointer going down starts a hold
 * (`onHold(true)`), and only that pointer's up, cancel or lost capture ends it (`onHold(false)`,
 * once). `bindHold` listens on the button and is registered as the `hold` store
 * (`src/library/view/stores.ts`); turned off (disabled, no longer a hold button) or unbound, it
 * ends a hold in progress.
 */
export interface HoldStore {
  /** A pointer went down: starts a hold when `enabled` (a hold button, not disabled) and none is in progress. */
  down(event: { pointerId: number; button: number }, enabled: boolean): void;
  /** A pointer went up, was cancelled or lost capture: ends the hold if it is that hold's pointer. */
  end(event: { pointerId: number }): void;
  /** Ends a hold in progress at once; `release` lets go of its pointer capture too. */
  stop(release: boolean): void;
}

export function createHold(node: () => HTMLElement | null | undefined, onHold: () => ((down: boolean) => void) | undefined): HoldStore {
  /** The pointer of the hold in progress. */
  let holdId: number | null = null;
  const stop = (release: boolean) => {
    const id = holdId;
    if (id === null) return;
    holdId = null;
    if (release) {
      try {
        node()?.releasePointerCapture?.(id);
      } catch {
        // No capture to release (jsdom, a pointer already gone).
      }
    }
    onHold()?.(false);
  };
  return {
    down(event, enabled) {
      if (!enabled || event.button !== 0 || holdId !== null) return;
      holdId = event.pointerId;
      try {
        node()?.setPointerCapture?.(event.pointerId);
      } catch {
        // jsdom and synthetic events have no pointer capture.
      }
      onHold()?.(true);
    },
    end(event) {
      if (holdId !== null && event.pointerId === holdId) stop(false);
    },
    stop,
  };
}

export interface HoldParams {
  /** A hold button that isn't disabled: pointers start holds. */
  enabled?: boolean;
  /** `true` when a primary pointer goes down, `false` once when that hold ends. */
  onHold?: (down: boolean) => void;
}

/** Listens on `node` for holds. Turned off mid-hold, it ends the hold and releases its pointer;
 *  destroyed mid-hold, it ends it. Params are read at each event. */
export function bindHold(node: HTMLElement, initial: HoldParams): { update(params: HoldParams): void; destroy(): void } {
  let params = initial;
  const holding = createHold(
    () => node,
    () => params.onHold,
  );
  const down = (event: PointerEvent) => holding.down(event, params.enabled === true);
  const end = (event: PointerEvent) => holding.end(event);
  node.addEventListener('pointerdown', down);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) node.addEventListener(type, end);
  return {
    update(next) {
      params = next;
      if (!params.enabled) holding.stop(true);
    },
    destroy() {
      holding.stop(false);
      node.removeEventListener('pointerdown', down);
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) node.removeEventListener(type, end);
    },
  };
}
