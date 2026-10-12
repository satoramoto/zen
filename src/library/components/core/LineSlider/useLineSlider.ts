import { useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';

/** The app's tooltip action, applied to the slider with its key (same shape as a Svelte action). */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => void | { update?: (key: string) => void; destroy?: () => void };

export interface UseLineSliderOptions {
  value: number;
  min: number;
  max: number;
  step: number;
  /** The accessible name. */
  name: string;
  /** The value as spoken, unit included. */
  valueText: string;
  disabled?: boolean;
  tip?: string;
  tipAction?: TipAction;
  onchange?: (value: number) => void;
}

export interface UseLineSlider {
  /** 0–1: where the value sits in the range. */
  fraction: number;
  /** A pointer is dragging the thumb. */
  held: boolean;
  /** Spread on the element that is the slider (role, aria, keys, drag). */
  sliderProps: HTMLAttributes<HTMLSpanElement> & {
    ref: RefObject<HTMLSpanElement | null>;
    'data-held'?: true;
  };
  /** The track whose width a drag maps onto the range. */
  trackRef: RefObject<HTMLSpanElement | null>;
}

/** Snaps to the step grid from `min`, then clamps; `toFixed` drops float dust (0.1 + 0.2). */
export function snap(v: number, min: number, max: number, step: number): number {
  const stepped = Math.round((v - min) / step) * step + min;
  return Math.max(min, Math.min(max, Number(stepped.toFixed(6))));
}

/**
 * The line slider's behaviour, without its look: controlled (asks through `onchange`), clamped
 * and snapped to the step; arrows one step, Page Up / Page Down ten, Home and End; a drag with
 * pointer capture maps the pointer onto the track; disabled stays focusable and asks nothing.
 */
export function useLineSlider({
  value,
  min,
  max,
  step,
  name,
  valueText,
  disabled = false,
  tip,
  tipAction,
  onchange,
}: UseLineSliderOptions): UseLineSlider {
  const span = Math.max(step, max - min);
  const fraction = Math.max(0, Math.min(1, (value - min) / span));

  const sliderRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  const dragging = useRef<number | null>(null);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const node = sliderRef.current;
    if (!tipAction || tip === undefined || !node) return;
    const handle = tipAction(node, tip);
    return () => {
      if (handle) handle.destroy?.();
    };
  }, [tipAction, tip]);

  function ask(v: number) {
    if (disabled) return;
    const next = snap(v, min, max, step);
    if (next !== value) onchange?.(next);
  }

  function fromPointer(clientX: number) {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box || box.width <= 0) return;
    ask(min + ((clientX - box.left) / box.width) * (max - min));
  }

  function onPointerDown(event: PointerEvent<HTMLSpanElement>) {
    if (disabled || event.button !== 0) return;
    dragging.current = event.pointerId;
    setHeld(true);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    fromPointer(event.clientX);
  }

  function onPointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (dragging.current === event.pointerId) fromPointer(event.clientX);
  }

  function onPointerEnd(event: PointerEvent<HTMLSpanElement>) {
    if (dragging.current !== event.pointerId) return;
    dragging.current = null;
    setHeld(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    const moves: Record<string, number> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + step * 10,
      PageDown: value - step * 10,
      Home: min,
      End: max,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    ask(moves[event.key]);
  }

  return {
    fraction,
    held,
    trackRef,
    sliderProps: {
      ref: sliderRef,
      role: 'slider',
      tabIndex: 0,
      'aria-label': name,
      'aria-valuemin': min,
      'aria-valuemax': max,
      'aria-valuenow': value,
      'aria-valuetext': valueText,
      'aria-disabled': disabled ? 'true' : undefined,
      'data-held': held || undefined,
      onKeyDown,
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  };
}
