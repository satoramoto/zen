import { useEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react';

/** The top of the travel: levels are 0–127, whole. */
export const FADER_MAX = 127;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** ↑ / → +1, ↓ / ← −1, Page Up / Down ±10 (Home 0, End 127 below). */
const STEPS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };
/** An ask the state hasn't confirmed is dropped after this pause, so `level` always wins in the end. */
const SETTLE_MS = 400;
/** A wheel notch in px: a trackpad's small deltas add up to one before the fader moves 2. */
const WHEEL_PX = 20;

export interface UseFaderOptions {
  /** The accessible name. */
  name: string;
  /** The value text announced with the level ("90", "Rev 40"). */
  value?: string;
  /** The set level, 0–127. */
  level: number;
  /** A parked fader is shown but not usable: no asks, `aria-disabled`. */
  parked?: boolean;
  /** The tooltip key; with `tipAction`, applied to the root once. */
  tip?: string;
  tipAction?: (
    node: HTMLElement,
    key: string,
  ) => { update?: (key: string) => void; destroy?: () => void } | void;
  /** Called with the level asked for (0–127, whole). */
  onlevel?: (level: number) => void;
}

export interface UseFader {
  /** Spread on the root: the slider role and aria, the ref, and the pointer and key handlers. */
  rootProps: {
    ref: RefObject<HTMLDivElement | null>;
    role: 'slider';
    tabIndex: 0;
    'aria-label': string;
    'aria-orientation': 'vertical';
    'aria-valuemin': 0;
    'aria-valuemax': number;
    'aria-valuenow': number;
    'aria-valuetext'?: string;
    'aria-disabled'?: true;
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  };
  /** The rail a drag measures: the pointer maps onto its height. */
  railRef: RefObject<HTMLSpanElement | null>;
}

/**
 * The Fader's behaviour, headless: fully controlled. A drag (pointer capture, each level once),
 * ↑ ↓ → ← ±1, Page Up / Down ±10, Home, End and the wheel (±2 a notch, trackpad deltas summed) ask
 * through `onlevel` and move nothing themselves; quick repeats count from the level last asked for
 * until `level` catches up, or until a short settle pause passes.
 */
export function useFader({ name, value = '', level, parked = false, tip, tipAction, onlevel }: UseFaderOptions): UseFader {
  const root = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);

  // The level last asked for, until the state catches up.
  const asked = useRef<number | null>(null);
  const askedAt = useRef(0);
  const lastSent = useRef<number | null>(null);
  const dragId = useRef<number | null>(null);
  const wheelAcc = useRef(0);

  useEffect(() => {
    if (level === asked.current) asked.current = null;
  }, [level]);

  // Handlers read the latest props through this ref: the wheel listener is attached once.
  const latest = useRef({ level, parked, onlevel });
  latest.current = { level, parked, onlevel };

  const base = () => {
    if (asked.current !== null && Date.now() - askedAt.current > SETTLE_MS) asked.current = null;
    return asked.current ?? clamp(latest.current.level, 0, FADER_MAX);
  };

  const ask = (next: number) => {
    const v = clamp(Math.round(next), 0, FADER_MAX);
    asked.current = v === latest.current.level ? null : v;
    askedAt.current = Date.now();
    // A drag repeats the same level on every pixel within a step: send each level once.
    if (dragId.current !== null && v === lastSent.current) return;
    lastSent.current = v;
    latest.current.onlevel?.(v);
  };
  const askRef = useRef({ ask, base });
  askRef.current = { ask, base };

  // React's wheel listener is passive; this one must be able to stop the page scrolling.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const wheel = (event: WheelEvent) => {
      if (latest.current.parked || event.deltaY === 0) return;
      event.preventDefault();
      const px = event.deltaMode === 1 ? event.deltaY * WHEEL_PX : event.deltaMode === 2 ? event.deltaY * WHEEL_PX * 10 : event.deltaY;
      if (Math.sign(px) !== Math.sign(wheelAcc.current)) wheelAcc.current = 0;
      wheelAcc.current += px;
      if (Math.abs(wheelAcc.current) < WHEEL_PX) return;
      const dir = wheelAcc.current < 0 ? 1 : -1;
      wheelAcc.current = 0;
      askRef.current.ask(askRef.current.base() + 2 * dir);
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || !tipAction || tip === undefined) return;
    const handle = tipAction(node, tip);
    return () => handle?.destroy?.();
  }, [tip, tipAction]);

  const levelAt = (clientY: number) => {
    const box = rail.current?.getBoundingClientRect();
    if (!box || box.height === 0) return level;
    return Math.round(clamp(1 - (clientY - box.top) / box.height, 0, 1) * FADER_MAX);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (parked || event.button > 0) return;
    dragId.current = event.pointerId;
    lastSent.current = null;
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    ask(levelAt(event.clientY));
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragId.current === event.pointerId) ask(levelAt(event.clientY));
  };
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragId.current === event.pointerId) dragId.current = null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (parked) return;
    let next: number | null = null;
    if (event.key in STEPS) next = base() + STEPS[event.key];
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = FADER_MAX;
    if (next === null) return;
    event.preventDefault();
    ask(next);
  };

  return {
    rootProps: {
      ref: root,
      role: 'slider',
      tabIndex: 0,
      'aria-label': name,
      'aria-orientation': 'vertical',
      'aria-valuemin': 0,
      'aria-valuemax': FADER_MAX,
      'aria-valuenow': clamp(Math.round(level), 0, FADER_MAX),
      'aria-valuetext': parked ? undefined : value || undefined,
      'aria-disabled': parked ? true : undefined,
      onPointerDown,
      onPointerMove,
      onPointerUp: pointerEnd,
      onPointerCancel: pointerEnd,
      onKeyDown,
    },
    railRef: rail,
  };
}
