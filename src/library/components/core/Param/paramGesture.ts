/**
 * The one gesture every continuous Param control shares, framework-free. A port of
 * `@openflow/widgets` `gesture/useParamGesture.ts`: grab where the value is (no jump to the click),
 * drag, hold the fine modifier (⌘ on macOS, Ctrl elsewhere) for a tenth of the speed, let go. Shift
 * drags the depth when `onDepth` is given. Double-click resets to the default (not after a drag);
 * Escape abandons a drag in hand; arrows step, Page Up / Down ten steps, Home / End the ends. A drag
 * writes at most once per frame; a key writes at once.
 *
 * `paramGesture(params, onDragging)` is the gesture itself, fed events by whoever owns the element;
 * `bindParamGesture(node, params)` is it as a store (native listeners on `node`, which it marks
 * `data-dragging` while a drag is in hand), registered as `paramGesture` in
 * `src/library/view/stores.ts`. `useParamGesture` (React) is a thin wrapper over `paramGesture`.
 */
import { format } from './format';
import { clamp, fractionOf, quantize, stepSize, valueAt, type Param } from './param';

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

/** What the gesture reads: everything but the ARIA text (`label`, `display`), which the view draws. */
export interface ParamGestureParams {
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
  /** Pixels of drag for the full range, or `element` for the element's own length along the axis. */
  travel?: number | 'element';
  /**
   * No single value (several things that differ): `value` is only where a drag starts from. The
   * first drag, key or double-click calls `onChange` even when it lands on `value`. A press and
   * release without moving leaves it mixed, and Escape mid-drag writes nothing back.
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

/** What a control prints: the authoritative text if there is one, else "Mixed" or the formatted value. */
export function gestureText(param: Param, value: number, display?: string, mixed = false): string {
  return display ?? (mixed ? MIXED_TEXT : format(param, value));
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

/** The pointer fields the gesture reads (a native `PointerEvent` or React's). */
export interface GesturePointer {
  pointerId: number;
  button: number;
  clientX: number;
  clientY: number;
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  preventDefault(): void;
}

/** The key fields the gesture reads (a native `KeyboardEvent` or React's). */
export interface GestureKey {
  key: string;
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  preventDefault(): void;
  stopPropagation(): void;
}

/** The gesture, fed events for one element. */
export interface ParamGestureCore {
  /** New params; a key's record goes stale once the control is given another value. */
  update(params: ParamGestureParams): void;
  pointerDown(e: GesturePointer, element: HTMLElement): void;
  pointerMove(e: GesturePointer): void;
  /** Pointer up, cancel, or lost capture: the drag (if it is this pointer's) ends. */
  pointerUp(e: { pointerId: number }): void;
  doubleClick(e: { shiftKey: boolean }): void;
  keyDown(e: GestureKey, element: HTMLElement): void;
  /** Drops whatever is waiting on the frame (the element is going). */
  cancel(): void;
}

/** The gesture over `initial` (then `update`'s params); `onDragging` hears a drag start and end. */
export function paramGesture(initial: ParamGestureParams, onDragging: (dragging: boolean) => void): ParamGestureCore {
  // Every moving part reads `now`, so a drag in flight can't be re-anchored by new params.
  let now = initial;
  let drag: {
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
  } | null = null;
  let wandered = false;
  let pending: number | null = null;
  let frame: number | null = null;
  let sent = Number.NaN;
  /** The last key's write, and the value the control was given when it was made. */
  let keyed: { given: number; sent: number } | null = null;

  const axis = () => now.axis ?? 'vertical';

  const flush = () => {
    frame = null;
    const next = pending;
    pending = null;
    if (next !== null) now.onChange(next);
  };

  /** At most one write per frame: a pointer can report faster than the browser paints. */
  const emit = (next: number) => {
    if (next === sent) return;
    sent = next;
    pending = next;
    if (frame === null) frame = requestAnimationFrame(flush);
  };

  /** Deliver whatever is waiting on the frame, now, and say the gesture is over. */
  const settle = () => {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      flush();
    }
    now.onRelease?.();
  };

  const finish = () => {
    if (drag === null) return;
    drag = null;
    onDragging(false);
    settle();
  };

  /**
   * A drag still in hand, put back where it was found (Escape). A drag that started mixed has no
   * value to go back to (`from` is only the placeholder), so nothing is written; whatever its moves
   * already wrote stands.
   */
  const abandon = () => {
    const held = drag;
    if (held === null) return;
    if (now.onDepth && held.fromDepth !== held.depth) now.onDepth(held.fromDepth);
    if (!held.mixed) {
      sent = Number.NaN;
      emit(quantize(now.param, held.from));
    }
    finish();
  };

  return {
    update(params) {
      now = params;
      // The record only bridges keys pressed before the host re-renders: once the control is given
      // any other value, it is stale, even if the value later comes back (an undo, a preset recall).
      if (keyed !== null && keyed.given !== params.value) keyed = null;
    },

    pointerDown(e, element) {
      if (now.disabled || e.button !== 0) return;
      e.preventDefault();
      element.focus();
      try {
        element.setPointerCapture(e.pointerId);
      } catch {
        // jsdom and synthetic events have no pointer capture.
      }
      // Mixed: nothing has been said yet, so even landing where the drag started is a write.
      sent = now.mixed ? Number.NaN : now.value;
      const box = element.getBoundingClientRect();
      // Screen pixels per CSS pixel here, so a zoomed canvas tracks the pointer.
      const drawn = element.offsetWidth;
      const scale = drawn > 0 ? box.width / drawn : 1;
      let fraction = fractionOf(now.param, now.value);
      if ((now.anchor ?? 'value') === 'pointer') {
        const along = axis() === 'vertical' ? (box.bottom - e.clientY) / (box.height || 1) : (e.clientX - box.left) / (box.width || 1);
        fraction = Math.max(0, Math.min(1, along));
        emit(valueAt(now.param, fraction));
      }
      wandered = false;
      keyed = null;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        ox: e.clientX,
        oy: e.clientY,
        fraction,
        depth: now.depth ?? 1,
        scale: scale > 0 ? scale : 1,
        extent: Math.max(1, axis() === 'vertical' ? element.offsetHeight : element.offsetWidth),
        from: now.value,
        fromDepth: now.depth ?? 1,
        mixed: now.mixed ?? false,
      };
      onDragging(true);
    },

    pointerMove(e) {
      const held = drag;
      if (held === null || held.id !== e.pointerId) return;
      const shift = axis() === 'vertical' ? held.y - e.clientY : e.clientX - held.x;
      if (Math.abs(e.clientX - held.ox) > CLICK_SLOP || Math.abs(e.clientY - held.oy) > CLICK_SLOP) wandered = true;
      const moved = shift / held.scale;
      held.x = e.clientX;
      held.y = e.clientY;
      // Distance accrues onto the fraction, so taking the fine modifier mid-drag slows the control
      // from where it is instead of teleporting it.
      const travel = now.travel ?? DEFAULT_TRAVEL;
      const reach = (travel === 'element' ? held.extent : travel) * (isFine(e) ? FINE_FACTOR : 1);
      if (e.shiftKey && now.onDepth) {
        held.depth = Math.max(-1, Math.min(1, held.depth + moved / (reach * DEPTH_REACH)));
        now.onDepth(held.depth);
        return;
      }
      held.fraction = Math.max(0, Math.min(1, held.fraction + moved / reach));
      // The fraction runs on unsnapped, so a drag can pull through a detent and out the far side.
      emit(snapToDetent(now.detents, now.snap, valueAt(now.param, held.fraction)));
    },

    pointerUp(e) {
      // Capture can go without a pointerup ever arriving; lost capture closes the drag too.
      if (drag?.id === e.pointerId) finish();
    },

    doubleClick(e) {
      if (now.disabled) return;
      // Two quick drags read as a double-click; resetting on that pair would throw both away.
      if (wandered) return;
      // Shift-double-click takes the depth to nothing and leaves the value alone.
      if (e.shiftKey && now.onDepth) {
        now.onDepth(0);
        if (drag !== null) finish();
        else settle();
        return;
      }
      if (now.mixed) sent = Number.NaN;
      keyed = null;
      emit(quantize(now.param, now.param.defaultValue));
      if (drag !== null) finish();
      else settle();
    },

    keyDown(e, element) {
      if (now.disabled) return;
      if (e.key === 'Escape') {
        if (drag === null) return;
        e.preventDefault();
        e.stopPropagation();
        abandon();
        return;
      }
      const fine = isFine(e);
      // Step from the last key's value while the host hasn't handed back a new one yet, so two
      // keys before a re-render each count.
      const held = keyed;
      const from = held !== null && held.given === now.value ? held.sent : now.value;
      const own = now.keyStep?.({ key: e.key, shiftKey: e.shiftKey, fine }, from);
      const next = own ?? defaultKeyStep(now.param, e.key, from, fine);
      if (next === undefined) return;
      e.preventDefault();
      // A focused control owns its keystroke; a host listening on the window must not also act.
      e.stopPropagation();
      // A key writes now, not on the next frame; anything a drag left waiting is stale.
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      pending = null;
      // A key mid-drag ends the drag: its write is the commit, so a later Escape has nothing to
      // abandon and later moves don't carry on from the old fraction.
      const dragged = drag;
      if (dragged !== null) {
        drag = null;
        onDragging(false);
        try {
          element.releasePointerCapture(dragged.id);
        } catch {
          // jsdom and synthetic events have no pointer capture.
        }
      }
      const value = quantize(now.param, clamp(now.param, next));
      sent = value;
      keyed = { given: now.value, sent: value };
      now.onChange(value);
      now.onRelease?.();
    },

    cancel() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      pending = null;
    },
  };
}

/** A bound gesture: `params` changed, or unbound. */
export interface ParamGestureBinding {
  update(params: ParamGestureParams): void;
  destroy(): void;
}

/**
 * The gesture as a store on `node` (the control's surface): pointer drag with capture, double-click,
 * keys. While a drag is in hand the node carries `data-dragging`.
 */
export function bindParamGesture(node: HTMLElement, initial: ParamGestureParams): ParamGestureBinding {
  const gesture = paramGesture(initial, (dragging) => {
    if (dragging) node.setAttribute('data-dragging', '');
    else node.removeAttribute('data-dragging');
  });
  const down = (e: PointerEvent) => gesture.pointerDown(e, node);
  const move = (e: PointerEvent) => gesture.pointerMove(e);
  const up = (e: PointerEvent) => gesture.pointerUp(e);
  const dbl = (e: MouseEvent) => gesture.doubleClick(e);
  const key = (e: KeyboardEvent) => gesture.keyDown(e, node);
  const listeners: [string, EventListener][] = [
    ['pointerdown', down as EventListener],
    ['pointermove', move as EventListener],
    ['pointerup', up as EventListener],
    ['pointercancel', up as EventListener],
    ['lostpointercapture', up as EventListener],
    ['dblclick', dbl as EventListener],
    ['keydown', key as EventListener],
  ];
  for (const [type, listener] of listeners) node.addEventListener(type, listener);
  return {
    update: (params) => gesture.update(params),
    destroy() {
      gesture.cancel();
      node.removeAttribute('data-dragging');
      for (const [type, listener] of listeners) node.removeEventListener(type, listener);
    },
  };
}
