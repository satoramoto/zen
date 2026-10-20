/**
 * TempoReadout's gestures, framework-free stores, registered as `tempoNumber` and `tempoStep` in
 * `src/library/view/stores.ts`; TempoReadout's tree binds them in both renderers.
 *
 * - `bindTempoNumber`: on the number, a primary-button drag asks for a tempo every `DRAG_PX`
 *   (pointer capture, one call per new value), a wheel step asks for ±1 (not passive, so the page
 *   doesn't scroll), ↑ → ↓ ← step 1 and Page Up / Down 10, and a double-click resets. Every ask is
 *   clamped to `min`–`max`, and the wheel and keys ask only for a value other than `bpm`.
 * - `bindTempoStep`: on + or −, a primary press reports `true` and its release (up, leave, cancel)
 *   `false` once; a keyboard click (no pointer detail) reports one press and release.
 */
import { clampTempo, DRAG_PX, STEP_KEYS } from './TempoReadout.model';

export interface TempoNumberParams {
  bpm: number;
  min?: number;
  max?: number;
  onTempo?: (bpm: number) => void;
  onReset?: () => void;
}

export interface TempoStepParams {
  /** Called with `true` when held, `false` when released. */
  report?: (down: boolean) => void;
}

/** A bound gesture: `params` changed, or unbound. */
export interface Binding<P> {
  update(params: P): void;
  destroy(): void;
}

/** Listens on the number `node` for drags, wheel steps, step keys and double-clicks. */
export function bindTempoNumber(node: HTMLElement, initial: TempoNumberParams): Binding<TempoNumberParams> {
  let params = initial;
  let drag: { id: number; y: number; from: number; last: number } | null = null;
  const clamp = (n: number) => clampTempo(n, params.min ?? 5, params.max ?? 500);
  const ask = (next: number) => {
    const v = clamp(next);
    if (v !== Math.round(params.bpm)) params.onTempo?.(v);
  };

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, y: e.clientY, from: params.bpm, last: params.bpm };
    node.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    const next = clamp(d.from + Math.trunc((d.y - e.clientY) / DRAG_PX));
    if (next === d.last) return;
    d.last = next;
    params.onTempo?.(next);
  }
  function onPointerUp(e: PointerEvent) {
    const d = drag;
    if (!d || e.pointerId !== d.id) return;
    node.releasePointerCapture?.(e.pointerId);
    drag = null;
  }
  function onKeyDown(e: KeyboardEvent) {
    const step = STEP_KEYS[e.key];
    if (step === undefined) return;
    e.preventDefault();
    ask(params.bpm + step);
  }
  function onWheel(e: WheelEvent) {
    if (e.deltaY === 0) return;
    e.preventDefault();
    ask(params.bpm + (e.deltaY < 0 ? 1 : -1));
  }
  function onDoubleClick() {
    params.onReset?.();
  }

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerUp);
  node.addEventListener('pointercancel', onPointerUp);
  node.addEventListener('keydown', onKeyDown);
  node.addEventListener('wheel', onWheel, { passive: false });
  node.addEventListener('dblclick', onDoubleClick);
  return {
    update(next) {
      params = next;
    },
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointercancel', onPointerUp);
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('dblclick', onDoubleClick);
    },
  };
}

/** Listens on a + or − key `node` and reports its presses as a hold. */
export function bindTempoStep(node: HTMLElement, initial: TempoStepParams): Binding<TempoStepParams> {
  let params = initial;
  let held = false;
  const release = () => {
    if (!held) return;
    held = false;
    params.report?.(false);
  };
  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;
    held = true;
    params.report?.(true);
  }
  // A click with no pointer detail is the keyboard's (Enter or Space): one step.
  function onClick(e: MouseEvent) {
    if (e.detail !== 0) return;
    params.report?.(true);
    params.report?.(false);
  }

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointerup', release);
  node.addEventListener('pointerleave', release);
  node.addEventListener('pointercancel', release);
  node.addEventListener('click', onClick);
  return {
    update(next) {
      params = next;
    },
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointerup', release);
      node.removeEventListener('pointerleave', release);
      node.removeEventListener('pointercancel', release);
      node.removeEventListener('click', onClick);
    },
  };
}
