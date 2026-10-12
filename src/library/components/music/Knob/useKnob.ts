import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { DRAG_PX, FINE_PX, WHEEL_PX, wheelPx } from './geometry';

/** The app's tooltip hook: given the node and its tip key, it may return an updater and a teardown. */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => { update?: (key: string) => void; destroy?: () => void } | void;

export interface UseKnobOptions {
  /** Nothing is mapped: no turning (a press still fires, as the original's). */
  unused?: boolean;
  /** The accessible name. */
  name: string;
  tip?: string;
  tipAction?: TipAction;
  /** A click that didn't turn the knob, Space or Enter. */
  onpress?: () => void;
  /** Steps turned (positive: clockwise). */
  onstep?: (delta: number) => void;
}

export interface UseKnob {
  /** Spread on the button that is the knob: its ref, handlers and aria. */
  rootProps: ButtonHTMLAttributes<HTMLButtonElement> & { ref: RefObject<HTMLButtonElement | null> };
}

const KEY_STEP: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };

/**
 * The knob's behaviour, without its look: a drag turns it relative to where it is (a step every
 * 4px up or right, 16px with Shift), ↑ → / ↓ ← and the wheel step it (a trackpad's small deltas
 * adding up to one notch), and a click that didn't turn it is a press, as are Space and Enter.
 */
export function useKnob({ unused = false, name, tip, tipAction, onpress, onstep }: UseKnobOptions): UseKnob {
  const ref = useRef<HTMLButtonElement>(null);
  // Latest props for the native wheel listener, which is bound once.
  const live = useRef({ unused, onstep });
  live.current = { unused, onstep };

  const drag = useRef<{ id: number; x: number; y: number; acc: number } | null>(null);
  /** This press turned the knob: its click isn't also a press. */
  const turned = useRef(false);

  // The wheel needs a non-passive listener to keep the page from scrolling under the knob.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let acc = 0;
    const onWheel = (event: WheelEvent) => {
      if (live.current.unused || event.deltaY === 0) return;
      event.preventDefault();
      const px = wheelPx(event.deltaY, event.deltaMode);
      if (Math.sign(px) !== Math.sign(acc)) acc = 0;
      acc += px;
      if (Math.abs(acc) < WHEEL_PX) return;
      acc = 0;
      live.current.onstep?.(px < 0 ? 1 : -1);
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [tipAction, tip]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (unused) return;
    const step = KEY_STEP[event.key] ?? 0;
    if (step === 0) return;
    event.preventDefault();
    onstep?.(step);
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    turned.current = false;
    if (unused || event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, acc: 0 };
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    // Up or right is clockwise.
    d.acc += (d.y - event.clientY + (event.clientX - d.x)) / (event.shiftKey ? FINE_PX : DRAG_PX);
    d.x = event.clientX;
    d.y = event.clientY;
    const steps = Math.trunc(d.acc);
    if (steps === 0) return;
    d.acc -= steps;
    turned.current = true;
    onstep?.(steps);
  }

  function onPointerEnd(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id === event.pointerId) drag.current = null;
  }

  function onClick(event: MouseEvent<HTMLButtonElement>) {
    // A drag isn't a press; Enter / Space (detail 0) always are.
    if (turned.current && event.detail > 0) {
      turned.current = false;
      return;
    }
    onpress?.();
  }

  return {
    rootProps: {
      ref,
      type: 'button',
      'aria-label': name,
      'aria-roledescription': 'knob',
      onClick,
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onKeyDown,
    },
  };
}
