/**
 * BarReadout's input, framework-free: the drag (relative, 2px a unit, Shift 8px, sends batched to
 * one per animation frame), the wheel (one step, a non-passive listener so the page doesn't
 * scroll), the keys (arrows one, Page Up / Page Down ten, Home and End the ends), the double-click
 * reset, and the local value a live edit shows until the state reports the value last sent or
 * 500 ms pass. Registered as the `barInput` store (`src/library/view/stores.ts`); BarReadout's tree
 * binds it in both renderers, and its state goes to the binding's view state through `onState`.
 */
import { step } from './bar';

/** What the input reads from the row's props. */
export interface BarParams {
  /** The value as the state gives it. */
  value: number;
  min: number;
  max: number;
  steps?: number[];
  /** Sends nothing. */
  disabled?: boolean;
  /** The value a double-click resets to (the row's `default`). */
  reset: number;
  /** Called with each value sent. */
  onChange?: (value: number) => void;
}

/** What the row draws from the input: the live edit's value (null: none) and whether a drag is on. */
export interface BarState {
  local: number | null;
  dragging: boolean;
}

/** The params plus where the state goes. */
export interface BarBindParams extends BarParams {
  /** Called with the state whenever it changes. */
  onState: (state: BarState) => void;
}

/** A bound row: new params (the state may have caught up with the edit), or unbound. */
export interface BarBinding {
  update(params: BarBindParams): void;
  destroy(): void;
}

/** How long a sent value is shown before the state must have caught up. */
export const HOLD_MS = 500;

const KEY_DELTAS: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };

/** Listens on `node` (the slider) for drags, the wheel, keys and double-clicks, until destroyed. */
export function bindBarInput(node: HTMLElement, initial: BarBindParams): BarBinding {
  let params = initial;
  let local: number | null = null;
  let dragging = false;
  let lastSent: number | null = null;
  let drag: { id: number; x0: number; v0: number } | null = null;
  let frame = 0;
  let pending: number | null = null;
  let hold: ReturnType<typeof setTimeout> | undefined;

  const emit = () => params.onState({ local, dragging });
  const setLocal = (v: number | null) => {
    if (v === local) return;
    local = v;
    emit();
  };
  const setDragging = (on: boolean) => {
    if (on === dragging) return;
    dragging = on;
    emit();
  };
  const shownNow = () => local ?? params.value;
  const range = () => ({ min: params.min, max: params.max, steps: params.steps });
  const ends = () => {
    const { min, max, steps } = params;
    return steps !== undefined && steps.length > 0 ? { lo: steps[0], hi: steps[steps.length - 1] } : { lo: min, hi: max };
  };

  function release() {
    clearTimeout(hold);
    hold = undefined;
    setLocal(null);
  }

  /** A live edit ends when the state reports the value last sent (or after the hold below). */
  function settle() {
    if (local !== null && drag === null && lastSent !== null && params.value === lastSent) release();
  }

  /** Keeps the local value until the state matches it, or HOLD_MS after the last send. */
  function holdLocal() {
    clearTimeout(hold);
    hold = setTimeout(() => {
      if (drag === null) setLocal(null);
    }, HOLD_MS);
  }

  function send(next: number) {
    lastSent = next;
    params.onChange?.(next);
    holdLocal();
  }

  /** A wheel or key edit: shown at once and sent when it differs. */
  function nudge(next: number) {
    if (params.disabled) return;
    if (next === shownNow()) return;
    setLocal(next);
    send(next);
    settle();
  }

  function flush() {
    frame = 0;
    if (pending !== null && pending !== lastSent) send(pending);
    pending = null;
  }

  function onWheel(event: WheelEvent) {
    if (event.deltaY === 0) return;
    event.preventDefault();
    nudge(step(shownNow(), event.deltaY < 0 ? 1 : -1, range()));
  }

  function onPointerDown(event: PointerEvent) {
    if (params.disabled || event.button !== 0) return;
    drag = { id: event.pointerId, x0: event.clientX, v0: shownNow() };
    lastSent = shownNow();
    clearTimeout(hold);
    setDragging(true);
    try {
      node.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (drag === null || drag.id !== event.pointerId) return;
    const delta = Math.trunc((event.clientX - drag.x0) / (event.shiftKey ? 8 : 2));
    const next = step(drag.v0, delta, range());
    setLocal(next);
    pending = next;
    if (frame === 0) frame = requestAnimationFrame(flush);
  }

  function onPointerEnd(event: PointerEvent) {
    if (drag === null || drag.id !== event.pointerId) return;
    drag = null;
    setDragging(false);
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
    pending = null;
    const now = local;
    if (now !== null && now !== lastSent) send(now);
    else if (now === null || now === params.value) release();
    else holdLocal();
  }

  function onKeyDown(event: KeyboardEvent) {
    let next: number;
    if (event.key in KEY_DELTAS) next = step(shownNow(), KEY_DELTAS[event.key], range());
    else if (event.key === 'Home') next = ends().lo;
    else if (event.key === 'End') next = ends().hi;
    else return;
    event.preventDefault();
    event.stopPropagation();
    nudge(next);
  }

  function onDoubleClick() {
    if (params.disabled) return;
    setLocal(params.reset);
    send(params.reset);
    settle();
  }

  node.addEventListener('wheel', onWheel, { passive: false });
  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerEnd);
  node.addEventListener('pointercancel', onPointerEnd);
  node.addEventListener('keydown', onKeyDown);
  node.addEventListener('dblclick', onDoubleClick);
  return {
    update(next) {
      params = next;
      settle();
    },
    destroy() {
      if (frame !== 0) cancelAnimationFrame(frame);
      clearTimeout(hold);
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerEnd);
      node.removeEventListener('pointercancel', onPointerEnd);
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('dblclick', onDoubleClick);
    },
  };
}
