// StepValue's maths and its press-drag-wheel-key handling, ported from the original's `adjust`
// action (yahaha/src/ui/Readout/readout.ts). Pure functions first, then `bindStepAdjust`, a plain
// store registered as `stepAdjust` in `src/library/view/stores.ts`: StepValue's tree binds it by name.

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Where `value` sits in `min`–`max`, 0–1. */
export function fraction(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

/** The value after a horizontal drag of `dx` px from `v0`, when `width` px spans the whole range. */
export function dragValue(v0: number, dx: number, width: number, min: number, max: number): number {
  if (width <= 0) return clamp(Math.round(v0), min, max);
  return clamp(Math.round(v0 + (dx * (max - min)) / width), min, max);
}

/** One wheel notch or arrow key's step: 1 for a 0–127 range, coarser for a wide one. */
export function stepOf(min: number, max: number): number {
  return Math.max(1, Math.round((max - min) / 127));
}

/** The value a key asks for, or null when the key isn't one of ours. */
export function keyValue(key: string, value: number, min: number, max: number): number | null {
  const step = stepOf(min, max);
  const to: Record<string, number> = {
    ArrowRight: value + step,
    ArrowUp: value + step,
    ArrowLeft: value - step,
    ArrowDown: value - step,
    PageUp: value + 10 * step,
    PageDown: value - 10 * step,
    Home: min,
    End: max,
  };
  return key in to ? clamp(to[key], min, max) : null;
}

/** The keys a focused StepValue handles: none of them reach the window's shortcuts. */
const KEYS = new Set(['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Enter']);

export interface StepAdjustParams {
  value: number;
  min: number;
  max: number;
  defaultValue?: number;
  disabled?: boolean;
  /** The px a drag across the whole range takes. */
  span: number;
  onchange?: (value: number) => void;
}

/**
 * Press and drag sideways (relative to the press, the span standing for the whole range); a wheel
 * notch or an arrow key steps it, Page Up / Down by ten steps, Home and End to the ends; a
 * double-click puts it back to its default. A press without movement sends nothing; while
 * dragging, at most one change per animation frame, and the last one on release; the node is
 * marked `data-dragging` meanwhile. Native listeners: the wheel is non-passive to keep the page
 * from scrolling, and the keys stop at the node so the window's shortcuts never see them.
 */
export function bindStepAdjust(node: HTMLElement, initial: StepAdjustParams): { update(params: StepAdjustParams): void; destroy(): void } {
  let p = initial;
  let drag: { id: number; x0: number; v0: number; sent: number } | null = null;
  let pending: number | null = null;
  let frame = 0;

  function send(v: number) {
    if (p.disabled || v === p.value) return;
    p.onchange?.(v);
  }
  function flush() {
    frame = 0;
    if (pending === null || !drag) return;
    const v = pending;
    pending = null;
    if (v !== drag.sent) {
      drag.sent = v;
      p.onchange?.(v);
    }
  }
  function down(e: PointerEvent) {
    if (p.disabled || e.button !== 0) return;
    drag = { id: e.pointerId, x0: e.clientX, v0: p.value, sent: p.value };
    if (typeof node.setPointerCapture === 'function') {
      try {
        node.setPointerCapture(e.pointerId);
      } catch {
        // A synthetic pointer (tests) can't be captured; the drag still works.
      }
    }
    node.dataset.dragging = '';
  }
  function move(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return;
    const v = dragValue(drag.v0, e.clientX - drag.x0, p.span, p.min, p.max);
    if (v === drag.sent && pending === null) return;
    pending = v;
    if (typeof requestAnimationFrame !== 'function') flush();
    else if (!frame) frame = requestAnimationFrame(flush);
  }
  function up(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return;
    if (frame) cancelAnimationFrame(frame);
    flush();
    drag = null;
    delete node.dataset.dragging;
  }
  function wheel(e: WheelEvent) {
    if (p.disabled) return;
    e.preventDefault();
    const dir = e.deltaY < 0 || e.deltaX > 0 ? 1 : -1;
    send(clamp(p.value + dir * stepOf(p.min, p.max), p.min, p.max));
  }
  function key(e: KeyboardEvent) {
    if (!KEYS.has(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const v = keyValue(e.key, p.value, p.min, p.max);
    if (v !== null) send(v);
  }
  function dblclick() {
    if (p.defaultValue !== undefined) send(p.defaultValue);
  }

  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);
  node.addEventListener('wheel', wheel, { passive: false });
  node.addEventListener('keydown', key);
  node.addEventListener('dblclick', dblclick);
  return {
    update(next) {
      p = next;
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      drag = null;
      delete node.dataset.dragging;
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', up);
      node.removeEventListener('wheel', wheel);
      node.removeEventListener('keydown', key);
      node.removeEventListener('dblclick', dblclick);
    },
  };
}
