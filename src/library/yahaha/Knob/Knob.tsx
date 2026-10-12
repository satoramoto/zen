import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { BOX, DRAG_PX, FINE_PX, R, START, SWEEP, WHEEL_PX, arc, point, sweepOf, wheelPx } from './geometry';
import './Knob.css';

/** The app's tooltip hook: given the node and its tip key, it may return an updater and a teardown. */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => { update?: (key: string) => void; destroy?: () => void } | void;

export interface KnobProps {
  /** The plain name ("Dynamics", "Retrig rate"). For an unused knob, the board's "---". */
  label: string;
  /** The Genos code beneath the ring ("DynCtrl"). */
  code?: string;
  /** The value as shown ("127", "1/8", "Off"). */
  value?: string;
  /** A small unit after the value ("%"). */
  unit?: string;
  /** How far round the arc is, 0–1 of its 270°. */
  fraction?: number;
  /** Nothing is mapped to this knob: dim name, an empty ring, no value. */
  unused?: boolean;
  /** The part this knob belongs to (1–4): its arc wears that part's hue. Default: ink. */
  hue?: 1 | 2 | 3 | 4;
  /** The accessible name. Default: "{label} ({code}) {value}{unit}", or "unused". */
  name?: string;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip hook, applied with `tip` when both are set. */
  tipAction?: TipAction;
  /** Called on a click that didn't turn the knob, Space or Enter. */
  onpress?: () => void;
  /** Called with the steps turned (positive: clockwise): ±1 on a key or a wheel notch, the steps a drag covered. Not when unused. */
  onstep?: (delta: number) => void;
}

const KEY_STEP: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };

/**
 * Knob: one of the eight band knobs.
 *
 * **Job.** Say what this knob sets and where it is now, in one glance from arm's length, and
 * invite a turn. The player reads the number first, the arc second (how far round), the name
 * third; the Genos code is reference only.
 *
 * **Changed.** *Hierarchy and numerals:* the value moves into the ring's centre in the readout
 * face at numeral weight with tabular figures, so the number and the arc that measures it read as
 * one object, and the value no longer jumps width as it changes (`typography.md`, Tabular
 * Numbers). *Colour meaning:* the original painted value, arc and dot in the accent; here the
 * accent is kept for focus only and the arc is drawn in ink, or in the part's hue when `hue` says
 * which part owns the knob (`color.md`, the 60/30/10 rule and "maximum 2 colours per component").
 * *Affordance:* the tip dot becomes a pointer tick just outside the ring at the arc's end, like
 * the index mark beside a hardware knob, so it looks like something that turns; outside the
 * stroke it never merges into a neutral knob's lit arc of the same ink; hovering lifts the track and
 * the cursor says drag up/down. *Contrast:* the track is a mix of ink into the ground, so it
 * stays visible on light palettes where the original's fixed grey vanished; an unused knob keeps
 * a fainter track and a dim name. *Rhythm:* name, ring and code sit on the library's spacing and
 * scale with `--control-h`, labels follow the pack's `--label-case` and tracking, and a visible
 * `:focus-visible` ring uses the accent (`craft-details.md`, Focus States). *Hierarchy at rest*:
 * a value of "0" or "Off" steps down to `--text-3`, so a knob that does nothing reads quieter
 * than one at 127 (the rule SendReadout uses for a send at 0). *Legibility*: the name wraps to
 * two balanced lines instead of an ellipsis, and every knob keeps two lines' room, so rings line
 * up across a bank; the Genos code is optional, drawn only when given, in the readout face (no
 * mono on the Stage).
 *
 * **Kept.** Fully controlled, and the same input: a drag turns it relative to where it is (a
 * step every 4px up or right, 16px with Shift) and never jumps to the pointer; ↑ → / ↓ ← and the
 * wheel step it, a trackpad's small deltas adding up to one notch; a click that didn't turn it is
 * a press, as are Space and Enter. The 270° sweep from bottom left, the spoken name and the
 * unused state are the original's.
 */
export function Knob({
  label,
  code = '',
  value = '',
  unit = '',
  fraction = 0,
  unused = false,
  hue,
  name,
  tip,
  tipAction,
  onpress,
  onstep,
}: KnobProps) {
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

  function keydown(event: KeyboardEvent<HTMLButtonElement>) {
    if (unused) return;
    const step = KEY_STEP[event.key] ?? 0;
    if (step === 0) return;
    event.preventDefault();
    onstep?.(step);
  }

  function pointerdown(event: PointerEvent<HTMLButtonElement>) {
    turned.current = false;
    if (unused || event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, acc: 0 };
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
  }

  function pointermove(event: PointerEvent<HTMLButtonElement>) {
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

  function pointerend(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.id === event.pointerId) drag.current = null;
  }

  function click(event: MouseEvent<HTMLButtonElement>) {
    // A drag isn't a press; Enter / Space (detail 0) always are.
    if (turned.current && event.detail > 0) {
      turned.current = false;
      return;
    }
    onpress?.();
  }

  const deg = unused ? 0 : sweepOf(fraction);
  const track = arc(START, START + SWEEP);
  const lit = arc(START, START + deg);
  // The pointer: a short tick just outside the ring at the arc's end, so it never merges into the
  // lit arc (same ink on a neutral knob) and stays clear of the value in the centre.
  const tipOuter = point(START + deg, R + 7);
  const tipInner = point(START + deg, R + 3);
  const spoken = name ?? (unused ? 'unused' : `${label}${code ? ` (${code})` : ''} ${value}${unit}`);
  // "0" and "Off" say "nothing here" and step back, as a send at 0 does (SendReadout).
  const rest = !unused && /^(0|off)$/i.test(value.trim());

  return (
    <button
      ref={ref}
      type="button"
      className="yh-knob"
      data-unused={unused || undefined}
      data-rest={rest || undefined}
      data-hue={hue}
      data-tip={tip}
      aria-label={spoken}
      aria-roledescription="knob"
      onClick={click}
      onPointerDown={pointerdown}
      onPointerMove={pointermove}
      onPointerUp={pointerend}
      onPointerCancel={pointerend}
      onKeyDown={keydown}
    >
      <span className="yh-knob__label">{label}</span>
      <span className="yh-knob__dial">
        <svg className="yh-knob__ring" viewBox={`0 0 ${BOX} ${BOX}`} aria-hidden="true">
          <path className="yh-knob__track" d={track} />
          {!unused && lit && <path className="yh-knob__lit" d={lit} />}
          {!unused && (
            <line
              className="yh-knob__pointer"
              x1={tipInner.x.toFixed(2)}
              y1={tipInner.y.toFixed(2)}
              x2={tipOuter.x.toFixed(2)}
              y2={tipOuter.y.toFixed(2)}
            />
          )}
        </svg>
        {!unused && (
          <span className="yh-knob__value">
            {value}
            {unit && <span className="yh-knob__unit">{unit}</span>}
          </span>
        )}
      </span>
      {code && <span className="yh-knob__code">{code}</span>}
    </button>
  );
}
