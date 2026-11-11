/**
 * The surface's input, framework-free: every control sits in a cell (`[data-control]`), and this
 * one store on the surface's root hears pointers, keys and the wheel on those cells and reports
 * each as a `PushInput`. It changes nothing else: a press is reported, not acted on (openspec:
 * push-surface). Registered as the `pushSurface` store.
 *
 * - A button or a pad: down and up, from a pointer, from Space or Enter on the focused control,
 *   and for pads from the keyboard's four rows of eight.
 * - Several at once: each pointer holds its own control; a right-click or the L key latches the
 *   control it is on (down now, up when latched again or on Escape), so every hold-and-press of
 *   the unit can be made with one mouse.
 * - A pad's expression: velocity from the pointer's force where it gives one, else a default (Alt
 *   for a hard press); pressure from force, or the wheel while held with a mouse; slide from where
 *   on the pad's height it is touched; bend from sideways movement, carried across pads.
 * - A rotary control: a touch while a pointer rests on it, while an arrow key is down on it, and
 *   for a moment after a wheel notch, so a turn always falls between a touch and a release. The
 *   turn itself is the control's own (`KnobReadout`), reported by the surface's handlers.
 * - The touch strip: a touch, its position from 0 at the bottom to 1 at the top, and a release.
 * - Pulsing and blinking: while any lamp animates, two properties on the root follow the beat
 *   (`--push-blink`, `--push-pulse`); the stylesheet reads them. Not under reduced motion.
 *
 * What it writes to the DOM is decoration only: `data-held` and `data-latched` on a cell, and a
 * held pad's `--push-pressure`, `--push-touch-x` and `--push-touch-y` (on the cell's
 * `.push-surface__feel`, which the tree gives no style of its own).
 */
import type { InputKind, PushInput } from '../../model/types';
import { blinkAt, pulseAt, type Beat } from './lampClock';
import { DEFAULT_SENSITIVITY, HARD_VELOCITY, MOUSE_VELOCITY, SLIDE_DEAD, WHEEL_PRESSURE, bendOf, hasForce, padForKey, slideOf, velocityOf, type Sensitivity } from './padInput';

export interface SurfaceInputParams {
  /** Every input a person makes. */
  onInput?: (input: PushInput) => void;
  sensitivity?: Sensitivity;
  /** Where zero bend is: the pad's centre, or wherever the finger lands. */
  inTune?: 'pad' | 'finger';
  /** The width around the in-tune place that does not bend, as a share of a pad's width. */
  inTuneWidth?: number;
  slideRange?: 'full' | 'half';
  /** The beat pulsing and blinking lamps follow; without one they free-run. */
  beat?: Beat;
  /** Whether any lamp pulses or blinks now. */
  animate?: boolean;
}

export interface SurfaceBinding {
  update(params: SurfaceInputParams): void;
  destroy(): void;
}

/** How long after a wheel notch an encoder stays touched. */
export const WHEEL_TOUCH_MS = 350; // added

type CellKind = 'pad' | 'button' | 'encoder' | 'wheel' | 'strip' | 'display';

/** One thing holding a control down: a pointer, a key or a latch. */
interface Hold {
  control: string;
  kind: CellKind;
  cell: HTMLElement;
  /** A pad's own measures while a pointer holds it. */
  pad?: { inTuneX: number; startY: number; width: number; height: number; top: number; real: boolean; sliding: boolean; pressure: number; slide: number; bend: number };
  /** A press on a latched control only clears the latch: its release reports nothing. */
  swallow?: boolean;
}

const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

export function bindSurface(node: HTMLElement, initial: SurfaceInputParams): SurfaceBinding {
  let params = initial;
  const pointers = new Map<number, Hold>();
  const keys = new Map<string, Hold>();
  const latches = new Map<string, Hold>();
  /** How many things hold each control: it goes down on the first and up on the last. */
  const counts = new Map<string, number>();
  const wheelTouch = new Map<string, { timer: ReturnType<typeof setTimeout>; hold: Hold }>();
  let frame = 0;

  const now = () => performance.now();
  /** A pointer's force is a 32-bit float: three places are all it means. */
  const force = (event: PointerEvent) => Math.round(event.pressure * 1000) / 1000;
  const emit = (control: string, kind: InputKind, more: Partial<PushInput> = {}) => params.onInput?.({ control, kind, time: now(), ...more });
  const cellOf = (target: EventTarget | null): HTMLElement | null => (target instanceof Element ? (target.closest('[data-control]') as HTMLElement | null) : null);
  const kindOf = (cell: HTMLElement) => cell.dataset.kind as CellKind;
  const rotary = (kind: CellKind) => kind === 'encoder' || kind === 'wheel';

  /** The first holder of a control reports it going down (or touched). */
  function begin(hold: Hold, more: Partial<PushInput> = {}): void {
    const n = counts.get(hold.control) ?? 0;
    counts.set(hold.control, n + 1);
    if (n > 0) return;
    hold.cell.dataset.held = '';
    if (rotary(hold.kind)) emit(hold.control, 'touch');
    else if (hold.kind === 'strip') emit(hold.control, 'touch', more);
    else emit(hold.control, 'down', more);
  }

  /** The last holder to let go reports it coming up (or released). */
  function end(hold: Hold): void {
    const n = counts.get(hold.control) ?? 0;
    if (n <= 0) return;
    if (n > 1) {
      counts.set(hold.control, n - 1);
      return;
    }
    counts.delete(hold.control);
    delete hold.cell.dataset.held;
    for (const p of ['--push-pressure', '--push-touch-x', '--push-touch-y']) feel(hold.cell).style.removeProperty(p);
    if (rotary(hold.kind) || hold.kind === 'strip') emit(hold.control, 'release');
    else emit(hold.control, 'up');
  }

  function toggleLatch(cell: HTMLElement): void {
    const control = cell.dataset.control!;
    const kind = kindOf(cell);
    if (kind === 'display' || kind === 'strip') return;
    const held = latches.get(control);
    if (held) {
      latches.delete(control);
      delete cell.dataset.latched;
      end(held);
    } else {
      const hold: Hold = { control, kind, cell };
      latches.set(control, hold);
      cell.dataset.latched = '';
      begin(hold, kind === 'pad' ? { velocity: MOUSE_VELOCITY } : {});
    }
  }

  function clearLatches(): void {
    for (const hold of [...latches.values()]) toggleLatch(hold.cell);
  }

  /** Where a pointer is on a cell: across from the left and up from the bottom, each 0 to 1. */
  function place(cell: HTMLElement, event: PointerEvent) {
    const rect = cell.getBoundingClientRect();
    const x = rect.width ? (event.clientX - rect.left) / rect.width : 0.5;
    const y = rect.height ? 1 - (event.clientY - rect.top) / rect.height : 0.5;
    return { rect, x, y: Math.min(1, Math.max(0, y)) };
  }

  /** Where a held pad's touch is written: an element of the cell the tree gives no style, so a redraw cannot wipe it. */
  const feel = (cell: HTMLElement): HTMLElement => cell.querySelector<HTMLElement>('.push-surface__feel') ?? cell;

  function trace(hold: Hold, x: number, y: number): void {
    const el = feel(hold.cell);
    el.style.setProperty('--push-touch-x', String(x));
    el.style.setProperty('--push-touch-y', String(y));
    el.style.setProperty('--push-pressure', String(hold.pad?.pressure ?? 0));
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const nudge = event.target instanceof Element ? (event.target.closest('[data-nudge]') as HTMLElement | null) : null;
    if (nudge) {
      emit('jog', 'nudge', { value: Number(nudge.dataset.nudge) });
      return;
    }
    const cell = cellOf(event.target);
    if (!cell || pointers.has(event.pointerId)) return;
    const control = cell.dataset.control!;
    const kind = kindOf(cell);
    if (kind === 'display') return;
    // A press on a latched control lets it go.
    if (latches.has(control)) {
      toggleLatch(cell);
      pointers.set(event.pointerId, { control, kind, cell, swallow: true });
      return;
    }
    const hold: Hold = { control, kind, cell };
    if (kind === 'pad') {
      const { rect, x, y } = place(cell, event);
      const real = hasForce(event.pointerType, event.pressure);
      const velocity = real ? velocityOf(force(event), params.sensitivity ?? DEFAULT_SENSITIVITY) : event.altKey ? HARD_VELOCITY : MOUSE_VELOCITY;
      // Under the threshold, nothing sounds and nothing is held.
      if (velocity === undefined) return;
      const offset = (params.inTune ?? 'pad') === 'pad' ? x - 0.5 : 0;
      const slide = slideOf(y, params.slideRange);
      hold.pad = { inTuneX: event.clientX - offset * rect.width, startY: y, width: rect.width || 1, height: rect.height || 1, top: rect.top, real, sliding: false, pressure: real ? force(event) : 0, slide, bend: 0 };
      pointers.set(event.pointerId, hold);
      // The strike carries where on the pad's height it landed.
      begin(hold, { velocity, value: slide });
      const bend = bendOf(offset, params.inTuneWidth ?? 0);
      if (bend !== 0) {
        hold.pad.bend = bend;
        emit(control, 'bend', { value: bend });
      }
      trace(hold, x, y);
    } else if (kind === 'strip') {
      pointers.set(event.pointerId, hold);
      begin(hold, { value: place(cell, event).y });
    } else {
      pointers.set(event.pointerId, hold);
      begin(hold);
    }
    // The control keeps its pointer, so a drag off its edge still ends on it. A rotary control
    // captures its own (the knob's store does).
    if (!rotary(kind)) {
      try {
        cell.setPointerCapture?.(event.pointerId);
      } catch {
        // jsdom and synthetic events have no pointer capture.
      }
    }
  }

  function onPointerMove(event: PointerEvent): void {
    const hold = pointers.get(event.pointerId);
    if (!hold || hold.swallow) return;
    if (hold.kind === 'strip') {
      emit(hold.control, 'move', { value: place(hold.cell, event).y });
      return;
    }
    const pad = hold.pad;
    if (!pad) return;
    const x = (event.clientX - pad.inTuneX) / pad.width;
    const bend = bendOf(x, params.inTuneWidth ?? 0);
    if (bend !== pad.bend) {
      pad.bend = bend;
      emit(hold.control, 'bend', { value: bend });
    }
    const y = Math.min(1, Math.max(0, 1 - (event.clientY - pad.top) / pad.height));
    if (!pad.sliding && Math.abs(y - pad.startY) > SLIDE_DEAD) pad.sliding = true;
    if (pad.sliding) {
      const slide = slideOf(y, params.slideRange);
      if (slide !== pad.slide) {
        pad.slide = slide;
        emit(hold.control, 'slide', { value: slide });
      }
    }
    if (pad.real && force(event) !== pad.pressure) {
      pad.pressure = force(event);
      emit(hold.control, 'pressure', { value: pad.pressure });
    }
    trace(hold, x + 0.5, y);
  }

  function onPointerUp(event: PointerEvent): void {
    const hold = pointers.get(event.pointerId);
    if (!hold) return;
    pointers.delete(event.pointerId);
    if (!hold.swallow) end(hold);
  }

  function onContextMenu(event: MouseEvent): void {
    const cell = cellOf(event.target);
    if (!cell) return;
    event.preventDefault();
    toggleLatch(cell);
  }

  function onWheel(event: WheelEvent): void {
    const cell = cellOf(event.target);
    if (!cell || event.deltaY === 0) return;
    const control = cell.dataset.control!;
    const kind = kindOf(cell);
    if (rotary(kind)) {
      // Touched from the first notch until a moment after the last: the knob's own turn follows.
      const pending = wheelTouch.get(control);
      const hold: Hold = pending?.hold ?? { control, kind, cell };
      if (pending) clearTimeout(pending.timer);
      else begin(hold);
      const timer = setTimeout(() => {
        wheelTouch.delete(control);
        end(hold);
      }, WHEEL_TOUCH_MS);
      wheelTouch.set(control, { timer, hold });
      return;
    }
    if (kind !== 'pad') return;
    // The wheel is pressure on a pad a mouse holds.
    for (const hold of pointers.values()) {
      if (hold.control !== control || !hold.pad || hold.pad.real) continue;
      event.preventDefault();
      hold.pad.pressure = Math.round(Math.min(1, Math.max(0, hold.pad.pressure + (event.deltaY < 0 ? WHEEL_PRESSURE : -WHEEL_PRESSURE))) * 1000) / 1000;
      feel(hold.cell).style.setProperty('--push-pressure', String(hold.pad.pressure));
      emit(control, 'pressure', { value: hold.pad.pressure });
    }
  }

  function focusPad(row: number, col: number): void {
    const next = node.querySelector<HTMLElement>(`[data-control="pad-${row}-${col}"] button`);
    next?.focus();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      clearLatches();
      return;
    }
    const cell = cellOf(event.target);
    if (!cell || event.ctrlKey || event.metaKey) return;
    const control = cell.dataset.control!;
    const kind = kindOf(cell);
    if (kind === 'display' || kind === 'strip') return;
    if (event.key === 'l' || event.key === 'L') {
      if (!event.repeat) toggleLatch(cell);
      event.preventDefault();
      return;
    }
    if (rotary(kind)) {
      // An arrow key turns the knob (its own store does); the key held down is the touch.
      if (event.key in ARROWS && !keys.has(event.code)) {
        const hold: Hold = { control, kind, cell };
        keys.set(event.code, hold);
        begin(hold);
      }
      return;
    }
    if (kind === 'pad') {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const move = ARROWS[event.key];
      if (move) {
        event.preventDefault();
        focusPad(Math.min(8, Math.max(1, row + move[0])), Math.min(8, Math.max(1, col + move[1])));
        return;
      }
      const at = padForKey(event.key, row > 4);
      if (at) {
        event.preventDefault();
        if (event.repeat || keys.has(event.code)) return;
        const target = node.querySelector<HTMLElement>(`[data-control="pad-${at.row}-${at.col}"]`);
        if (!target) return;
        const hold: Hold = { control: target.dataset.control!, kind: 'pad', cell: target };
        keys.set(event.code, hold);
        begin(hold, { velocity: event.altKey ? HARD_VELOCITY : MOUSE_VELOCITY });
        return;
      }
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (event.repeat || keys.has(event.code)) return;
      if (latches.has(control)) {
        toggleLatch(cell);
        return;
      }
      const hold: Hold = { control, kind, cell };
      keys.set(event.code, hold);
      begin(hold, kind === 'pad' ? { velocity: event.altKey ? HARD_VELOCITY : MOUSE_VELOCITY } : {});
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    const hold = keys.get(event.code);
    if (!hold) return;
    keys.delete(event.code);
    end(hold);
  }

  /** A key's release is lost when focus leaves the surface: let everything the keys hold go. */
  function onFocusOut(event: FocusEvent): void {
    if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return;
    for (const [code, hold] of [...keys]) {
      keys.delete(code);
      end(hold);
    }
  }

  /* ---------- pulsing and blinking ---------- */

  const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tickLamps(): void {
    const time = now();
    node.style.setProperty('--push-blink', String(blinkAt(time, params.beat)));
    node.style.setProperty('--push-pulse', pulseAt(time, params.beat).toFixed(3));
    frame = requestAnimationFrame(tickLamps);
  }

  function runLamps(): void {
    const want = !!params.animate && !still() && typeof requestAnimationFrame === 'function';
    if (want && !frame) frame = requestAnimationFrame(tickLamps);
    if (!want && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      node.style.removeProperty('--push-blink');
      node.style.removeProperty('--push-pulse');
    }
  }

  /**
   * What is not on the face (the two pedals), or what a page drives from elsewhere (a footswitch
   * over Web MIDI, a script): a `pushinput` event on the surface whose detail names the control
   * and the kind is reported like any other input, with the time it arrived.
   */
  function onPushInput(event: Event): void {
    const detail = (event as CustomEvent<Partial<PushInput> | undefined>).detail;
    if (!detail || typeof detail.control !== 'string' || typeof detail.kind !== 'string') return;
    const { control, kind, time: _time, ...more } = detail;
    emit(control, kind, more);
  }

  // Capture, so a rotary control's touch is reported before its own store reports the turn.
  node.addEventListener('pointerdown', onPointerDown, true);
  node.addEventListener('pointermove', onPointerMove);
  node.addEventListener('pointerup', onPointerUp);
  node.addEventListener('pointercancel', onPointerUp);
  node.addEventListener('contextmenu', onContextMenu);
  node.addEventListener('wheel', onWheel, { capture: true, passive: false });
  node.addEventListener('keydown', onKeyDown, true);
  node.addEventListener('keyup', onKeyUp, true);
  node.addEventListener('focusout', onFocusOut);
  node.addEventListener('pushinput', onPushInput);
  runLamps();

  return {
    update(next) {
      params = next;
      runLamps();
    },
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown, true);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointercancel', onPointerUp);
      node.removeEventListener('contextmenu', onContextMenu);
      node.removeEventListener('wheel', onWheel, true);
      node.removeEventListener('keydown', onKeyDown, true);
      node.removeEventListener('keyup', onKeyUp, true);
      node.removeEventListener('focusout', onFocusOut);
      node.removeEventListener('pushinput', onPushInput);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      for (const { timer } of wheelTouch.values()) clearTimeout(timer);
      // Whatever is still down comes up: a control taken away mid-press reports its release.
      const holds = [...pointers.values(), ...keys.values(), ...latches.values(), ...[...wheelTouch.values()].map((w) => w.hold)].filter((h) => !h.swallow);
      pointers.clear();
      keys.clear();
      latches.clear();
      wheelTouch.clear();
      for (const control of [...counts.keys()]) {
        const hold = holds.find((h) => h.control === control);
        counts.set(control, 1);
        if (hold) end(hold);
      }
      counts.clear();
    },
  };
}
