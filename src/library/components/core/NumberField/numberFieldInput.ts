/**
 * NumberField's behaviour, framework-free: the value window's drag, keys and double-click, and the
 * editor that replaces it while typing. Registered as the `numberField` and `numberFieldEditor`
 * stores (`src/library/view/stores.ts`); NumberField's tree binds them by name.
 *
 * `bindNumberField` is `Param/useParamGesture.ts` re-expressed as a store, cut to what NumberField
 * uses (a horizontal drag anchored at the value; no depth, detents, mixed or own key steps): grab
 * where the value is, drag, hold the fine modifier (⌘ on macOS, Ctrl elsewhere) for a tenth of the
 * speed, let go. Double-click resets to the default (not after a drag); Escape abandons a drag in
 * hand; arrows step, Page Up / Down ten steps, Home / End the ends. A drag writes at most once per
 * frame; a key writes at once. While typeable, a digit, sign, point or Enter opens the editor
 * (`onEdit`) instead. While a pointer drags, the node is marked `data-dragging`.
 */
import { clamp, fractionOf, quantize, stepSize, valueAt, type Param } from '../Param/param';

/** Pixels of travel for the full range, before the fine modifier stretches it. */
const DEFAULT_TRAVEL = 200;
/** How much further a fine drag has to go to cover the same ground. */
const FINE_FACTOR = 10;
/** How far a pointer may wander and still have been a click (only the double-click reads it). */
const CLICK_SLOP = 3;
/** The keys that open the editor, with Enter. */
const OPENS_EDITOR = /^[-+.0-9]$/;

const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iP(hone|ad|od)/.test(navigator.userAgent + ' ' + ((navigator as { platform?: string }).platform ?? ''));

/** The fine-adjustment modifier, which is Live's: ⌘ on macOS, Ctrl elsewhere. */
const isFine = (e: { metaKey: boolean; ctrlKey: boolean }): boolean => (IS_MAC ? e.metaKey : e.ctrlKey);

/** The default keys: arrows a step, Page Up / Down ten, Home / End the ends; anything else, nothing. */
function keyStep(param: Param, key: string, value: number, fine: boolean): number | undefined {
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

export interface NumberFieldParams {
  param: Param;
  /** What the field holds. A drag anchors here and then ignores it. */
  value: number;
  disabled?: boolean;
  /** Pixels of drag for the full range. */
  travel?: number;
  /** A digit, sign, point or Enter opens the editor. */
  typeable?: boolean;
  onChange?(next: number): void;
  /** The gesture ended. */
  onRelease?(): void;
  /** Open the editor with this text (`''` for Enter, else the key typed). */
  onEdit?(text: string): void;
}

export interface NumberFieldBinding {
  update(params: NumberFieldParams): void;
  destroy(): void;
}

interface Drag {
  id: number;
  x: number;
  ox: number;
  oy: number;
  fraction: number;
  scale: number;
  from: number;
}

/** Listens on `node` (the value window) for drags, keys and double-clicks. */
export function bindNumberField(node: HTMLElement, initial: NumberFieldParams): NumberFieldBinding {
  let params = initial;
  let drag: Drag | null = null;
  let wandered = false;
  let pending: number | null = null;
  let frame: number | null = null;
  let sent = Number.NaN;
  /** The last key's write, and the value the field was given when it was made. */
  let keyed: { given: number; sent: number } | null = null;

  function setDragging(on: boolean) {
    if (on) node.setAttribute('data-dragging', '');
    else node.removeAttribute('data-dragging');
  }

  function flush() {
    frame = null;
    const next = pending;
    pending = null;
    if (next !== null) params.onChange?.(next);
  }

  /** At most one write per frame: a pointer can report faster than the browser paints. */
  function emit(next: number) {
    if (next === sent) return;
    sent = next;
    pending = next;
    if (frame === null) frame = requestAnimationFrame(flush);
  }

  /** Deliver whatever is waiting on the frame, now, and say the gesture is over. */
  function settle() {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      flush();
    }
    params.onRelease?.();
  }

  function finish() {
    if (drag === null) return;
    drag = null;
    setDragging(false);
    settle();
  }

  function onPointerDown(e: PointerEvent) {
    if (params.disabled || e.button !== 0) return;
    e.preventDefault();
    node.focus();
    try {
      node.setPointerCapture(e.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
    sent = params.value;
    const box = node.getBoundingClientRect();
    // Screen pixels per CSS pixel here, so a zoomed canvas tracks the pointer.
    const drawn = node.offsetWidth;
    const scale = drawn > 0 ? box.width / drawn : 1;
    wandered = false;
    keyed = null;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      ox: e.clientX,
      oy: e.clientY,
      fraction: fractionOf(params.param, params.value),
      scale: scale > 0 ? scale : 1,
      from: params.value,
    };
    setDragging(true);
  }

  function onPointerMove(e: PointerEvent) {
    const held = drag;
    if (held === null || held.id !== e.pointerId) return;
    if (Math.abs(e.clientX - held.ox) > CLICK_SLOP || Math.abs(e.clientY - held.oy) > CLICK_SLOP) wandered = true;
    const moved = (e.clientX - held.x) / held.scale;
    held.x = e.clientX;
    // Distance accrues onto the fraction, so taking the fine modifier mid-drag slows the field from
    // where it is instead of teleporting it.
    const reach = (params.travel ?? DEFAULT_TRAVEL) * (isFine(e) ? FINE_FACTOR : 1);
    held.fraction = Math.max(0, Math.min(1, held.fraction + moved / reach));
    emit(valueAt(params.param, held.fraction));
  }

  /** A pointerup, a cancel, or capture lost without a pointerup: the drag is over. */
  function onPointerEnd(e: PointerEvent) {
    if (drag?.id === e.pointerId) finish();
  }

  /** A drag still in hand, put back where it was found (Escape). */
  function abandon() {
    const held = drag;
    if (held === null) return;
    sent = Number.NaN;
    emit(quantize(params.param, held.from));
    finish();
  }

  function onDoubleClick() {
    if (params.disabled) return;
    // Two quick drags read as a double-click; resetting on that pair would throw both away.
    if (wandered) return;
    keyed = null;
    emit(quantize(params.param, params.param.defaultValue));
    if (drag !== null) finish();
    else settle();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (params.typeable && (e.key === 'Enter' || OPENS_EDITOR.test(e.key))) {
      e.preventDefault();
      e.stopPropagation();
      params.onEdit?.(e.key === 'Enter' ? '' : e.key);
      return;
    }
    if (params.disabled) return;
    if (e.key === 'Escape') {
      if (drag === null) return;
      e.preventDefault();
      e.stopPropagation();
      abandon();
      return;
    }
    const fine = isFine(e);
    // Step from the last key's value while the host hasn't handed back a new one yet, so two keys
    // before a re-render each count.
    const from = keyed !== null && keyed.given === params.value ? keyed.sent : params.value;
    const next = keyStep(params.param, e.key, from, fine);
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
    // A key mid-drag ends the drag: its write is the commit.
    const dragged = drag;
    if (dragged !== null) {
      drag = null;
      setDragging(false);
      try {
        node.releasePointerCapture(dragged.id);
      } catch {
        // jsdom and synthetic events have no pointer capture.
      }
    }
    const value = quantize(params.param, clamp(params.param, next));
    sent = value;
    keyed = { given: params.value, sent: value };
    params.onChange?.(value);
    params.onRelease?.();
  }

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerEnd);
  node.addEventListener('pointercancel', onPointerEnd);
  node.addEventListener('lostpointercapture', onPointerEnd);
  node.addEventListener('dblclick', onDoubleClick);
  node.addEventListener('keydown', onKeyDown);
  return {
    update(next) {
      params = next;
      // The key record only bridges keys pressed before the host re-renders: once the field is
      // given any other value, it is stale, even if the value later comes back.
      if (keyed !== null && keyed.given !== params.value) keyed = null;
    },
    destroy() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      drag = null;
      node.removeAttribute('data-dragging');
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerEnd);
      node.removeEventListener('pointercancel', onPointerEnd);
      node.removeEventListener('lostpointercapture', onPointerEnd);
      node.removeEventListener('dblclick', onDoubleClick);
      node.removeEventListener('keydown', onKeyDown);
    },
  };
}

export interface NumberFieldEditorParams {
  /** The text as typed. */
  onDraft?(text: string): void;
  /** Enter or blur: the text to commit. */
  onCommit?(text: string): void;
  /** Escape: close without a write. */
  onCancel?(): void;
}

/**
 * The editor (`node`, the input): focused when it appears; every edit reported through `onDraft`;
 * Enter or blur commits, Escape cancels. Only the first of those counts, so the blur of an editor
 * closing after Enter or Escape doesn't commit again.
 */
export function bindNumberFieldEditor(
  input: HTMLElement,
  initial: NumberFieldEditorParams,
): { update(params: NumberFieldEditorParams): void; destroy(): void } {
  const node = input as HTMLInputElement;
  let params = initial;
  let closed = false;

  function onInput() {
    params.onDraft?.(node.value);
  }

  function onBlur() {
    if (closed) return;
    closed = true;
    params.onCommit?.(node.value);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== 'Escape') return;
    e.preventDefault();
    if (closed) return;
    closed = true;
    if (e.key === 'Enter') params.onCommit?.(node.value);
    else params.onCancel?.();
  }

  node.addEventListener('input', onInput);
  node.addEventListener('blur', onBlur);
  node.addEventListener('keydown', onKeyDown);
  node.focus();
  return {
    update(next) {
      params = next;
    },
    destroy() {
      node.removeEventListener('input', onInput);
      node.removeEventListener('blur', onBlur);
      node.removeEventListener('keydown', onKeyDown);
    },
  };
}
