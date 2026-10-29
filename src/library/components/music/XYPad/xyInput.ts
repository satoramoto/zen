/**
 * XYPad's behaviour, framework-free and fully controlled. A drag anywhere in the field (pointer
 * capture, each point once, y inverted so up is 1) and the arrow keys (5% a press, 1% with Shift)
 * ask through `onMove` and move nothing themselves; a quick repeat counts from the point last asked
 * for until `x`/`y` catch up, or until a short settle pause passes. XYPad's tree binds it as the
 * `xyInput` store (`src/library/view/stores.ts`); `src/library/svelte.ts` exports it as an action.
 */
import { clamp01 } from './XYPad.model';

/** A point the pointer or keys asked for, 0–1 in both axes (y up). */
export interface XyPoint {
  x: number;
  y: number;
}

export interface XyInputParams {
  /** The set crosshair, 0–1 across. */
  x: number;
  /** The set crosshair, 0–1 up. */
  y: number;
  /** Shown but not usable: no asks. */
  disabled?: boolean;
  /** The box a drag measures. Default: the node itself, as XYPad draws it. */
  field?: () => HTMLElement | null;
  /** Called with the point asked for (0–1, y up). */
  onMove?: (x: number, y: number) => void;
}

/** A bound pad: new params (an `x`/`y` matching the last ask confirms it), or unbound. */
export interface XyInputBinding {
  update(params: XyInputParams): void;
  destroy(): void;
}

/** An ask the state hasn't confirmed is dropped after this pause, so `x`/`y` always win in the end. */
const SETTLE_MS = 400;
/** Arrow keys: a twentieth of the field a press, a hundredth with Shift. */
const KEY_STEP = 0.05;
const FINE_KEY_STEP = 0.01;

/** Three decimals: enough for a field a few hundred pixels wide, and a stable point to dedupe. */
const round = (n: number) => Math.round(n * 1000) / 1000;

/** Listens on `node` (the pad root) for drags and arrow keys, asking through `params.onMove`. */
export function bindXyInput(node: HTMLElement, initial: XyInputParams): XyInputBinding {
  let params = initial;
  // The point last asked for, until the state catches up.
  let asked: XyPoint | null = null;
  let askedAt = 0;
  let lastSent: string | null = null;
  let dragId: number | null = null;

  const base = (): XyPoint => {
    if (asked !== null && Date.now() - askedAt > SETTLE_MS) asked = null;
    return asked ?? { x: clamp01(params.x), y: clamp01(params.y) };
  };

  const ask = (x: number, y: number) => {
    const point = { x: round(clamp01(x)), y: round(clamp01(y)) };
    asked = point;
    askedAt = Date.now();
    // A drag repeats the same point on every pixel within a step: send each point once.
    const key = `${point.x},${point.y}`;
    if (dragId !== null && key === lastSent) return;
    lastSent = key;
    params.onMove?.(point.x, point.y);
  };

  const pointAt = (clientX: number, clientY: number): XyPoint | null => {
    const field = params.field ? params.field() : node;
    const box = field?.getBoundingClientRect();
    if (!box || box.width <= 0 || box.height <= 0) return null;
    return {
      x: (clientX - box.left) / box.width,
      // Up is 1: the pointer's distance from the top, inverted.
      y: 1 - (clientY - box.top) / box.height,
    };
  };

  function onPointerDown(event: PointerEvent) {
    if (params.disabled || event.button > 0) return;
    dragId = event.pointerId;
    lastSent = null;
    try {
      node.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    const point = pointAt(event.clientX, event.clientY);
    if (point) ask(point.x, point.y);
  }
  function onPointerMove(event: PointerEvent) {
    if (dragId !== event.pointerId) return;
    const point = pointAt(event.clientX, event.clientY);
    if (point) ask(point.x, point.y);
  }
  function onPointerEnd(event: PointerEvent) {
    if (dragId === event.pointerId) dragId = null;
  }
  function onKeyDown(event: KeyboardEvent) {
    if (params.disabled) return;
    const step = event.shiftKey ? FINE_KEY_STEP : KEY_STEP;
    const dx = event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0;
    const dy = event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0;
    if (dx === 0 && dy === 0) return;
    event.preventDefault();
    const from = base();
    ask(from.x + dx, from.y + dy);
  }

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerEnd);
  node.addEventListener('pointercancel', onPointerEnd);
  node.addEventListener('keydown', onKeyDown);
  return {
    update(next) {
      params = next;
      if (asked !== null && params.x === asked.x && params.y === asked.y) asked = null;
    },
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerEnd);
      node.removeEventListener('pointercancel', onPointerEnd);
      node.removeEventListener('keydown', onKeyDown);
    },
  };
}
