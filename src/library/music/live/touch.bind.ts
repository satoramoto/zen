// Touch on a continuous control, framework-free (registered as `liveTouch` in registry.stores.ts):
// it tells `onTouch(true)` when a gesture on the control begins and `onTouch(false)` when it ends,
// so an app can group a drag into one undo step or write automation while a hand is on the control.
// A gesture is a pointer held down on the element (until it lifts or is cancelled, wherever it has
// gone) or a key that moves a value held down (until it is let go, or focus leaves). It listens in
// the capture phase, so the begin reaches the app before the control's first move, and tells the end
// a moment after the lift, so the control's last move comes first. A control taken
// away mid-gesture still ends it: no touch is left down.

export interface TouchParams {
  /** Off: nothing is told (the control is being built or learned, not played). */
  disabled?: boolean;
  /** A gesture began (`true`) or ended (`false`). */
  onTouch?: (down: boolean) => void;
}

/** The keys that move a slider's or a knob's value. */
const MOVING_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);

export function bindTouch(node: HTMLElement, initial: TouchParams) {
  let params = initial;
  let pointers = 0;
  let key = false;
  let down = false;
  const win = node.ownerDocument.defaultView ?? window;

  const tell = () => {
    const now = pointers > 0 || key;
    if (now === down) return;
    down = now;
    params.onTouch?.(now);
  };
  const pointerDown = (e: PointerEvent) => {
    if (params.disabled || e.button !== 0) return;
    pointers++;
    tell();
  };
  // The end of a gesture is told once the event that ended it has reached the control: a control that
  // sends its last move on the lift (or on the key's release) still sends it inside the touch.
  let pending: number | undefined;
  const later = () => {
    if (pending !== undefined) return;
    pending = win.setTimeout(() => {
      pending = undefined;
      tell();
    }, 0);
  };
  const pointerUp = () => {
    if (pointers === 0) return;
    pointers--;
    later();
  };
  const keyDown = (e: KeyboardEvent) => {
    if (params.disabled || !MOVING_KEYS.has(e.key)) return;
    key = true;
    tell();
  };
  const keyUp = (e: KeyboardEvent) => {
    if (!MOVING_KEYS.has(e.key)) return;
    key = false;
    later();
  };
  const blur = () => {
    key = false;
    tell();
  };
  const end = () => {
    pointers = 0;
    key = false;
    tell();
  };

  node.addEventListener('pointerdown', pointerDown, true);
  // The lift may land anywhere: a drag leaves the control, and a captured pointer reports to it.
  win.addEventListener('pointerup', pointerUp, true);
  win.addEventListener('pointercancel', pointerUp, true);
  node.addEventListener('keydown', keyDown, true);
  node.addEventListener('keyup', keyUp, true);
  node.addEventListener('focusout', blur, true);

  return {
    update(next: TouchParams) {
      params = next;
      if (next.disabled) end();
    },
    destroy() {
      if (pending !== undefined) win.clearTimeout(pending);
      end();
      node.removeEventListener('pointerdown', pointerDown, true);
      win.removeEventListener('pointerup', pointerUp, true);
      win.removeEventListener('pointercancel', pointerUp, true);
      node.removeEventListener('keydown', keyDown, true);
      node.removeEventListener('keyup', keyUp, true);
      node.removeEventListener('focusout', blur, true);
    },
  };
}
