// StepValue's maths and its press-drag-wheel-key handling, ported from the original's `adjust`
// action (yahaha/src/ui/Readout/readout.ts) as a React hook. Pure functions first.

import { useEffect, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

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

export interface AdjustParams {
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
 * dragging, at most one change per animation frame, and the last one on release.
 */
export function useAdjust<T extends HTMLElement>(params: AdjustParams) {
  const ref = useRef<T>(null);
  const p = useRef(params);
  p.current = params;
  const drag = useRef<{ id: number; x0: number; v0: number; sent: number } | null>(null);
  const pending = useRef<number | null>(null);
  const frame = useRef(0);

  const send = (v: number) => {
    const { disabled, value, onchange } = p.current;
    if (disabled || v === value) return;
    onchange?.(v);
  };
  const flush = () => {
    frame.current = 0;
    const d = drag.current;
    if (pending.current === null || !d) return;
    const v = pending.current;
    pending.current = null;
    if (v !== d.sent) {
      d.sent = v;
      p.current.onchange?.(v);
    }
  };

  // Wheel needs a non-passive listener to keep the page from scrolling.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const wheel = (e: WheelEvent) => {
      const { disabled, value, min, max } = p.current;
      if (disabled) return;
      e.preventDefault();
      const dir = e.deltaY < 0 || e.deltaX > 0 ? 1 : -1;
      send(clamp(value + dir * stepOf(min, max), min, max));
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', wheel);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const end = (e: PointerEvent<T>) => {
    if (!drag.current || e.pointerId !== drag.current.id) return;
    if (frame.current) cancelAnimationFrame(frame.current);
    flush();
    drag.current = null;
    delete e.currentTarget.dataset.dragging;
  };

  const handlers = {
    onPointerDown(e: PointerEvent<T>) {
      if (p.current.disabled || e.button !== 0) return;
      drag.current = { id: e.pointerId, x0: e.clientX, v0: p.current.value, sent: p.current.value };
      const node = e.currentTarget;
      if (typeof node.setPointerCapture === 'function') {
        try {
          node.setPointerCapture(e.pointerId);
        } catch {
          // A synthetic pointer (tests) can't be captured; the drag still works.
        }
      }
      node.dataset.dragging = '';
    },
    onPointerMove(e: PointerEvent<T>) {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      const { min, max, span } = p.current;
      const v = dragValue(d.v0, e.clientX - d.x0, span, min, max);
      if (v === d.sent && pending.current === null) return;
      pending.current = v;
      if (typeof requestAnimationFrame !== 'function') flush();
      else if (!frame.current) frame.current = requestAnimationFrame(flush);
    },
    onPointerUp: end,
    onPointerCancel: end,
    onKeyDown(e: KeyboardEvent<T>) {
      if (!KEYS.has(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      const { value, min, max } = p.current;
      const v = keyValue(e.key, value, min, max);
      if (v !== null) send(v);
    },
    onDoubleClick() {
      const { defaultValue } = p.current;
      if (defaultValue !== undefined) send(defaultValue);
    },
  };

  return { ref, handlers };
}
