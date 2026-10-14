import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { format } from './format';
import { clamp, fractionOf, quantize, stepSize, valueAt, type Param } from './param';

/**
 * The one gesture every continuous Param control shares, headless. A port of `@openflow/widgets`
 * `gesture/useParamGesture.ts`: grab where the value is (no jump to the click), drag, hold the fine
 * modifier (⌘ on macOS, Ctrl elsewhere) for a tenth of the speed, let go. Shift drags the depth
 * when `onDepth` is given. Double-click resets to the default (not after a drag); Escape abandons a
 * drag in hand; arrows step, Page Up / Down ten steps, Home / End the ends. A drag writes at most
 * once per frame; a key writes at once.
 */

export type ParamAxis = 'vertical' | 'horizontal';

/** Where a drag starts from: the value the control holds, or the point that was pressed. */
export type ParamAnchor = 'value' | 'pointer';

/** Pixels of travel for the full range, before the fine modifier stretches it. */
const DEFAULT_TRAVEL = 200;
/** How much further a fine drag has to go to cover the same ground. */
const FINE_FACTOR = 10;
/** How much further a range (depth) drag goes than a value drag. */
const DEPTH_REACH = 1.5;
/** How far a pointer may wander and still have been a click (only the double-click reads it). */
const CLICK_SLOP = 3;

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iP(hone|ad|od)/.test(navigator.userAgent + ' ' + ((navigator as { platform?: string }).platform ?? ''));

/** What a mixed control reads, with no `display` of its own. */
const MIXED_TEXT = 'Mixed';

/** Label for the fine modifier, for hints and tooltips. */
export const FINE_KEY = IS_MAC ? '⌘' : 'Ctrl';

/** The fine-adjustment modifier, which is Live's: ⌘ on macOS, Ctrl elsewhere. */
export function isFine(e: { metaKey: boolean; ctrlKey: boolean }): boolean {
  return IS_MAC ? e.metaKey : e.ctrlKey;
}

export interface ParamGestureOptions {
  param: Param;
  /** What the control currently holds. A drag anchors here and then ignores it. */
  value: number;
  /** How far something else may carry this control from its value, signed; shift drags it. */
  depth?: number;
  onDepth?(next: number): void;
  onChange(next: number): void;
  /** The gesture ended: the moment a host can stop preferring its local value. */
  onRelease?(): void;
  disabled?: boolean;
  axis?: ParamAxis;
  /** Defaults to `value`: Live grabs a control where it is rather than jumping. */
  anchor?: ParamAnchor;
  travel?: number | 'element';
  label?: string;
  /** Authoritative text, when something else is spelling the value. */
  display?: string;
  /**
   * No single value (several things that differ): `value` is only where a drag starts from. ARIA
   * drops `aria-valuenow` and reads `display` (else "Mixed"); the first drag, key or double-click
   * calls `onChange` even when it lands on `value`. A press and release without moving leaves it
   * mixed, and Escape mid-drag writes nothing back.
   */
  mixed?: boolean;
  /** Values a drag catches on: within `snap` (in the parameter's units) of one, it lands there. */
  detents?: readonly number[];
  /** How near a detent a drag must come to land on it. Default 0: detents don't catch. */
  snap?: number;
  /** The keys' own next values, asked before the default steps (see `ParamKeyStep`). */
  keyStep?: ParamKeyStep;
}

/** The keystroke a `ParamKeyStep` is asked about. `fine` is the fine modifier (⌘ on macOS, Ctrl elsewhere). */
export interface ParamKey {
  key: string;
  shiftKey: boolean;
  fine: boolean;
}

/**
 * The value a key moves the control to from `value`, or `undefined` to leave the key to the default
 * (arrows a step, Page ten, Home / End the ends; any other key ignored). Asked for every key but a
 * drag's Escape; a returned value is clamped and quantized, and the key goes no further.
 */
export type ParamKeyStep = (key: ParamKey, value: number) => number | undefined;

/** The next detent from `value` in the direction `way`, or the last one that way when there is none further. */
export function stepDetent(detents: readonly number[], value: number, way: 1 | -1): number {
  const sorted = [...detents].sort((a, b) => a - b);
  if (sorted.length === 0) return value;
  const eps = 1e-9;
  if (way > 0) return sorted.find((d) => d > value + eps) ?? sorted[sorted.length - 1];
  return [...sorted].reverse().find((d) => d < value - eps) ?? sorted[0];
}

/** `value` moved onto the nearest detent within `snap`, else left where it is. */
export function snapToDetent(detents: readonly number[] | undefined, snap: number | undefined, value: number): number {
  if (detents === undefined || snap === undefined || snap <= 0) return value;
  let best = value;
  let gap = snap;
  for (const d of detents) {
    const off = Math.abs(value - d);
    if (off <= gap) {
      best = d;
      gap = off;
    }
  }
  return best;
}

/** The default keys: arrows a step, Page Up / Down ten, Home / End the ends; anything else, nothing. */
function defaultKeyStep(param: Param, key: string, value: number, fine: boolean): number | undefined {
  const step = stepSize(param, fine);
  switch (key) {
    case 'ArrowUp':
    case 'ArrowRight':
      return value + step;
    case 'ArrowDown':
    case 'ArrowLeft':
      return value - step;
    case 'PageUp':
      return value + step * 10;
    case 'PageDown':
      return value - step * 10;
    case 'Home':
      return param.min;
    case 'End':
      return param.max;
    default:
      return undefined;
  }
}

export interface ParamSurfaceProps {
  role: 'slider';
  tabIndex: number;
  'aria-label': string | undefined;
  'aria-valuemin': number;
  'aria-valuemax': number;
  /** Left out while `mixed`. */
  'aria-valuenow': number | undefined;
  'aria-valuetext': string;
  'aria-orientation': ParamAxis;
  'aria-disabled': true | undefined;
  'data-dragging': '' | undefined;
  onPointerDown(e: PointerEvent<HTMLElement>): void;
  onPointerMove(e: PointerEvent<HTMLElement>): void;
  onPointerUp(e: PointerEvent<HTMLElement>): void;
  onPointerCancel(e: PointerEvent<HTMLElement>): void;
  onLostPointerCapture(e: PointerEvent<HTMLElement>): void;
  onDoubleClick(e: MouseEvent<HTMLElement>): void;
  onKeyDown(e: KeyboardEvent<HTMLElement>): void;
}

export interface ParamGesture {
  dragging: boolean;
  /** Where the value sits on the control, 0 to 1, tapered. */
  fraction: number;
  /** What to print: the authoritative text if there is one, else our own. */
  text: string;
  props: ParamSurfaceProps;
}

export function useParamGesture(options: ParamGestureOptions): ParamGesture {
  const {
    param,
    value,
    onChange,
    onRelease,
    disabled = false,
    depth,
    onDepth,
    axis = 'vertical',
    anchor = 'value',
    travel = DEFAULT_TRAVEL,
    label,
    display,
    mixed = false,
    detents,
    snap,
    keyStep,
  } = options;

  const [dragging, setDragging] = useState(false);

  // Every moving part reads through a ref so the handlers stay stable and a drag in flight can't
  // be re-anchored by a re-render underneath it.
  const latest = useRef({ param, value, onChange, onRelease, disabled, depth, onDepth, mixed, detents, snap, keyStep });
  latest.current = { param, value, onChange, onRelease, disabled, depth, onDepth, mixed, detents, snap, keyStep };

  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    ox: number;
    oy: number;
    fraction: number;
    depth: number;
    scale: number;
    extent: number;
    from: number;
    fromDepth: number;
    /** Whether the drag started mixed, so `from` is only a placeholder. */
    mixed: boolean;
  } | null>(null);
  const wandered = useRef(false);
  const pending = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const sent = useRef(Number.NaN);
  /** The last key's write, and the value the control was given when it was made. */
  const keyed = useRef<{ given: number; sent: number } | null>(null);
  // The record only bridges keys pressed before the host re-renders: once the control is given any
  // other value, it is stale, even if the value later comes back (an undo, a preset recall).
  if (keyed.current !== null && keyed.current.given !== value) keyed.current = null;

  const flush = useCallback(() => {
    frame.current = null;
    const next = pending.current;
    pending.current = null;
    if (next !== null) latest.current.onChange(next);
  }, []);

  /** At most one write per frame: a pointer can report faster than the browser paints. */
  const emit = useCallback(
    (next: number) => {
      if (next === sent.current) return;
      sent.current = next;
      pending.current = next;
      if (frame.current === null) frame.current = requestAnimationFrame(flush);
    },
    [flush],
  );

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  /** Deliver whatever is waiting on the frame, now, and say the gesture is over. */
  const settle = useCallback(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      flush();
    }
    latest.current.onRelease?.();
  }, [flush]);

  const finish = useCallback(() => {
    if (drag.current === null) return;
    drag.current = null;
    setDragging(false);
    settle();
  }, [settle]);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const now = latest.current;
      if (now.disabled || e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.focus();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // jsdom and synthetic events have no pointer capture.
      }
      // Mixed: nothing has been said yet, so even landing where the drag started is a write.
      sent.current = now.mixed ? Number.NaN : now.value;
      const box = e.currentTarget.getBoundingClientRect();
      // Screen pixels per CSS pixel here, so a zoomed canvas tracks the pointer.
      const drawn = e.currentTarget.offsetWidth;
      const scale = drawn > 0 ? box.width / drawn : 1;
      let fraction = fractionOf(now.param, now.value);
      if (anchor === 'pointer') {
        const along =
          axis === 'vertical'
            ? (box.bottom - e.clientY) / (box.height || 1)
            : (e.clientX - box.left) / (box.width || 1);
        fraction = Math.max(0, Math.min(1, along));
        emit(valueAt(now.param, fraction));
      }
      wandered.current = false;
      keyed.current = null;
      drag.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        ox: e.clientX,
        oy: e.clientY,
        fraction,
        depth: now.depth ?? 1,
        scale: scale > 0 ? scale : 1,
        extent: Math.max(1, axis === 'vertical' ? e.currentTarget.offsetHeight : e.currentTarget.offsetWidth),
        from: now.value,
        fromDepth: now.depth ?? 1,
        mixed: now.mixed,
      };
      setDragging(true);
    },
    [anchor, axis, emit],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const held = drag.current;
      if (held === null || held.id !== e.pointerId) return;
      const shift = axis === 'vertical' ? held.y - e.clientY : e.clientX - held.x;
      if (Math.abs(e.clientX - held.ox) > CLICK_SLOP || Math.abs(e.clientY - held.oy) > CLICK_SLOP) {
        wandered.current = true;
      }
      const moved = shift / held.scale;
      held.x = e.clientX;
      held.y = e.clientY;
      // Distance accrues onto the fraction, so taking the fine modifier mid-drag slows the control
      // from where it is instead of teleporting it.
      const reach = (travel === 'element' ? held.extent : travel) * (isFine(e) ? FINE_FACTOR : 1);
      const now = latest.current;
      if (e.shiftKey && now.onDepth) {
        held.depth = Math.max(-1, Math.min(1, held.depth + moved / (reach * DEPTH_REACH)));
        now.onDepth(held.depth);
        return;
      }
      held.fraction = Math.max(0, Math.min(1, held.fraction + moved / reach));
      // The fraction runs on unsnapped, so a drag can pull through a detent and out the far side.
      emit(snapToDetent(now.detents, now.snap, valueAt(now.param, held.fraction)));
    },
    [axis, emit, travel],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (drag.current?.id === e.pointerId) finish();
    },
    [finish],
  );

  /**
   * A drag still in hand, put back where it was found (Escape). A drag that started mixed has no
   * value to go back to (`from` is only the placeholder), so nothing is written; whatever its moves
   * already wrote stands.
   */
  const abandon = useCallback(() => {
    const held = drag.current;
    if (held === null) return;
    const now = latest.current;
    if (now.onDepth && held.fromDepth !== held.depth) now.onDepth(held.fromDepth);
    if (!held.mixed) {
      sent.current = Number.NaN;
      emit(quantize(now.param, held.from));
    }
    finish();
  }, [emit, finish]);

  /** Capture can go without a pointerup ever arriving; close the drag so it can't stick. */
  const onLostPointerCapture = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (drag.current?.id === e.pointerId) finish();
    },
    [finish],
  );

  const onDoubleClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      const now = latest.current;
      if (now.disabled) return;
      // Two quick drags read as a double-click; resetting on that pair would throw both away.
      if (wandered.current) return;
      // Shift-double-click takes the depth to nothing and leaves the value alone.
      if (e.shiftKey && now.onDepth) {
        now.onDepth(0);
        if (drag.current !== null) finish();
        else settle();
        return;
      }
      if (now.mixed) sent.current = Number.NaN;
      keyed.current = null;
      emit(quantize(now.param, now.param.defaultValue));
      if (drag.current !== null) finish();
      else settle();
    },
    [emit, finish, settle],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const now = latest.current;
      if (now.disabled) return;
      if (e.key === 'Escape') {
        if (drag.current === null) return;
        e.preventDefault();
        e.stopPropagation();
        abandon();
        return;
      }
      const fine = isFine(e);
      // Step from the last key's value while the host hasn't handed back a new one yet, so two
      // keys before a re-render each count.
      const held = keyed.current;
      const from = held !== null && held.given === now.value ? held.sent : now.value;
      const own = now.keyStep?.({ key: e.key, shiftKey: e.shiftKey, fine }, from);
      const next = own ?? defaultKeyStep(now.param, e.key, from, fine);
      if (next === undefined) return;
      e.preventDefault();
      // A focused control owns its keystroke; a host listening on the window must not also act.
      e.stopPropagation();
      // A key writes now, not on the next frame; anything a drag left waiting is stale.
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
      pending.current = null;
      // A key mid-drag ends the drag: its write is the commit, so a later Escape has nothing to
      // abandon and later moves don't carry on from the old fraction.
      const dragged = drag.current;
      if (dragged !== null) {
        drag.current = null;
        setDragging(false);
        try {
          e.currentTarget.releasePointerCapture(dragged.id);
        } catch {
          // jsdom and synthetic events have no pointer capture.
        }
      }
      const value = quantize(now.param, clamp(now.param, next));
      sent.current = value;
      keyed.current = { given: now.value, sent: value };
      now.onChange(value);
      now.onRelease?.();
    },
    [abandon],
  );

  const text = display ?? (mixed ? MIXED_TEXT : format(param, value));
  return {
    dragging,
    fraction: fractionOf(param, value),
    text,
    props: {
      role: 'slider',
      tabIndex: disabled ? -1 : 0,
      'aria-label': label,
      'aria-valuemin': param.min,
      'aria-valuemax': param.max,
      'aria-valuenow': mixed ? undefined : value,
      'aria-valuetext': text,
      'aria-orientation': axis,
      'aria-disabled': disabled || undefined,
      'data-dragging': dragging ? '' : undefined,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onLostPointerCapture,
      onDoubleClick,
      onKeyDown,
    },
  };
}
