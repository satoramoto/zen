/**
 * Button's repeat-while-held (`hold`), framework-free: a primary pointer going down starts a hold
 * (`onHold(true)`), and only that pointer's up, cancel or lost capture ends it (`onHold(false)`,
 * once). Each renderer creates one per button, feeds it its pointer events, and stops it when the
 * hold can't continue (disabled, no longer a hold button, unmounted).
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
