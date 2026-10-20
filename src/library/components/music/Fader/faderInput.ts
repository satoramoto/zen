/**
 * The Fader's behaviour, framework-free and fully controlled. A drag (pointer capture, each level
 * once), ↑ ↓ → ← ±1, Page Up / Down ±10, Home, End and the wheel (±2 a notch, trackpad deltas
 * summed) ask through `onlevel` and move nothing themselves; quick repeats count from the level last
 * asked for until `level` catches up, or until a short settle pause passes. Fader's tree binds it as
 * the `faderInput` store (`src/library/view/stores.ts`); `src/library/svelte.ts` exports it as an action.
 */
import { FADER_MAX, clamp } from './Fader.model';

export { FADER_MAX } from './Fader.model';

/** ↑ / → +1, ↓ / ← −1, Page Up / Down ±10 (Home 0, End 127 below). */
const STEPS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };
/** An ask the state hasn't confirmed is dropped after this pause, so `level` always wins in the end. */
const SETTLE_MS = 400;
/** A wheel notch in px: a trackpad's small deltas add up to one before the fader moves 2. */
const WHEEL_PX = 20;

export interface FaderParams {
  /** The set level, 0–127. */
  level: number;
  /** A parked fader is shown but not usable: no asks. */
  parked?: boolean;
  /** The rail a drag measures: the pointer maps onto its height. Default: the node's own rail
   *  (`[data-part="rail"]` or `.yh-fader__rail` inside it), as Fader draws it. */
  rail?: () => HTMLElement | null;
  /** Called with the level asked for (0–127, whole). */
  onlevel?: (level: number) => void;
}

/** A bound fader: new params (a `level` matching the last ask confirms it), or unbound. */
export interface FaderBinding {
  update(params: FaderParams): void;
  destroy(): void;
}

/** Listens on `node` (the slider root) for drags, keys and the wheel, asking through `params.onlevel`. */
export function bindFader(node: HTMLElement, initial: FaderParams): FaderBinding {
  let params = initial;
  // The level last asked for, until the state catches up.
  let asked: number | null = null;
  let askedAt = 0;
  let lastSent: number | null = null;
  let dragId: number | null = null;
  let wheelAcc = 0;

  const base = () => {
    if (asked !== null && Date.now() - askedAt > SETTLE_MS) asked = null;
    return asked ?? clamp(params.level, 0, FADER_MAX);
  };

  const ask = (next: number) => {
    const v = clamp(Math.round(next), 0, FADER_MAX);
    asked = v === params.level ? null : v;
    askedAt = Date.now();
    // A drag repeats the same level on every pixel within a step: send each level once.
    if (dragId !== null && v === lastSent) return;
    lastSent = v;
    params.onlevel?.(v);
  };

  const levelAt = (clientY: number) => {
    const rail = params.rail ? params.rail() : node.querySelector<HTMLElement>('[data-part="rail"], .yh-fader__rail');
    const box = rail?.getBoundingClientRect();
    if (!box || box.height === 0) return params.level;
    return Math.round(clamp(1 - (clientY - box.top) / box.height, 0, 1) * FADER_MAX);
  };

  function onPointerDown(event: PointerEvent) {
    if (params.parked || event.button > 0) return;
    dragId = event.pointerId;
    lastSent = null;
    try {
      node.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    ask(levelAt(event.clientY));
  }
  function onPointerMove(event: PointerEvent) {
    if (dragId === event.pointerId) ask(levelAt(event.clientY));
  }
  function onPointerEnd(event: PointerEvent) {
    if (dragId === event.pointerId) dragId = null;
  }
  function onKeyDown(event: KeyboardEvent) {
    if (params.parked) return;
    let next: number | null = null;
    if (event.key in STEPS) next = base() + STEPS[event.key];
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = FADER_MAX;
    if (next === null) return;
    event.preventDefault();
    ask(next);
  }
  // Not passive: it must be able to stop the page scrolling.
  function onWheel(event: WheelEvent) {
    if (params.parked || event.deltaY === 0) return;
    event.preventDefault();
    const px = event.deltaMode === 1 ? event.deltaY * WHEEL_PX : event.deltaMode === 2 ? event.deltaY * WHEEL_PX * 10 : event.deltaY;
    if (Math.sign(px) !== Math.sign(wheelAcc)) wheelAcc = 0;
    wheelAcc += px;
    if (Math.abs(wheelAcc) < WHEEL_PX) return;
    const dir = wheelAcc < 0 ? 1 : -1;
    wheelAcc = 0;
    ask(base() + 2 * dir);
  }

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerEnd);
  node.addEventListener('pointercancel', onPointerEnd);
  node.addEventListener('keydown', onKeyDown);
  node.addEventListener('wheel', onWheel, { passive: false });
  return {
    update(next) {
      params = next;
      if (params.level === asked) asked = null;
    },
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerEnd);
      node.removeEventListener('pointercancel', onPointerEnd);
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('wheel', onWheel);
    },
  };
}
