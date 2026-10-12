import { useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import type { BarKind } from './bar';
import { fillBox, formatValue, fraction, step } from './bar';
import './BarReadout.css';

export type { BarKind } from './bar';

export interface BarReadoutProps {
  /** The row's label ("Level"). */
  label: string;
  /** The value, in the control's own units (with `steps`: Hz, shown as given). */
  value: number;
  /** The lowest value. */
  min: number;
  /** The highest value. */
  max: number;
  /** A Hz table: the bar sits at the nearest step and every move goes by steps of it. */
  steps?: number[];
  /** How the value shows (number, dB, ms, Hz, pan, offset, ratio, or the `display` string). */
  kind?: BarKind;
  /** The value as the state gives it, for kind `display` ("0.50 Hz", "1/8", "On"). */
  display?: string;
  /** The fill grows from the centre (pan, gains). */
  bipolar?: boolean;
  /** The value a double-click resets to. */
  default: number;
  /** Not there: "—", no fill, drawn faint; still focusable, sends nothing. */
  disabled?: boolean;
  /** The words a disabled row reads after its name ("not available"). */
  absent?: string;
  /** The hardware fader hasn't reached the value yet (soft takeover): a "↕" after the label. */
  waiting?: boolean;
  /** Words appended to the spoken value (", off"). */
  suffix?: string;
  /** The accessible name; default the label. */
  name?: string;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** Called with each value sent. */
  onChange?: (value: number) => void;
}

const KEY_DELTAS: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };

/**
 * BarReadout: one row of the Channel page's groups, a label, a thin bar and the value with its unit.
 *
 * **Job.** Show one mixer or insert setting (level, pan, an EQ frequency, a send) so a player reads
 * the number and, from the bar, roughly where it sits in its range, and let them set it: press
 * anywhere on the bar and drag sideways (relative, 2px a unit, Shift 8px), the wheel and arrows step
 * one, Page Up / Page Down ten, Home and End the ends, a double-click resets to `default`. While an
 * edit is live the fill and value follow the local value until the state catches up. Controlled:
 * it sends through `onChange`.
 *
 * **Changed.** *Hierarchy:* the label is the Stage's one caption (caption size, body weight,
 * `--text-3`, the pack's label case) and the value the strongest thing in the row, primary text at
 * body size in the readout face and numeral weight, the unit smaller and fainter after it
 * (typography.md, "Text Color System"); Readout uses the same recipe. *Numerals:* tabular figures
 * in a right-aligned slot sized in `ch` for the widest value ("16.0 kHz", "−48 dB"), and the unit
 * in a fixed column drawn even when empty, so "90", "−18 dB" and "8.0 kHz" line up on their last
 * digit rather than on the unit, and a drag never makes the row jitter, even under packs whose
 * readout face is proportional (typography.md, "Tabular Numbers"). *Colour meaning:* the fill
 * and its cap take one ink, `--yh-bar-readout-ink` (the accent unless the page points it at the
 * part's hue), the track is a tint of the text colour so it shows on light and dark palettes, and
 * the soft-takeover "↕" is the one thing drawn in `--warning`, because the fader really is away
 * (color.md, "Semantic Colors"). *Affordance:* a bipolar row marks its centre with a tick, the track
 * thickens under the pointer and while dragging, the cursor says "drag sideways", and focus is a
 * `:focus-visible` ring in the accent (craft-details.md, "Focus States"). A disabled row draws its
 * track dashed and its text in the muted `--text-3` (never the faint `--text-4`, which vanished on
 * dark packs), so "not there" reads differently from "at zero" and can still be read.
 *
 * **Kept.** One control-height row of label, bar and value; the fill from zero or from the centre;
 * the 2px cap at the value; every input and its feel (frame-batched drag sends, the local value held
 * until the state matches or 500 ms pass); the slider role, name, `aria-valuetext` ("Level 90",
 * "Low freq 120 Hz", "Ratio 3:1"), "hardware fader away", and a disabled row that stays focusable
 * and reads its absence ("Send 5, not added").
 *
 * **Tuning knobs.**
 * - `--yh-bar-readout-ink`: the fill and cap's ink (default `--accent`; a page may point it at a hue).
 * - `--yh-bar-readout-line`: the line's thickness, a hairline at rest and `--space-1` under the
 *   pointer or while dragging.
 */
export function BarReadout({
  label,
  value,
  min,
  max,
  steps,
  kind = 'number',
  display,
  bipolar = false,
  default: reset,
  disabled = false,
  absent = 'not available',
  waiting = false,
  suffix = '',
  name,
  tip,
  onChange,
}: BarReadoutProps) {
  /** The value a live edit shows until the state catches up; null: none. */
  const [local, setLocalState] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const localRef = useRef<number | null>(null);
  const lastSent = useRef<number | null>(null);
  const drag = useRef<{ id: number; x0: number; v0: number } | null>(null);
  const frame = useRef(0);
  const pending = useRef<number | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const barRef = useRef<HTMLSpanElement>(null);

  // The latest props, for handlers and timers that outlive a render.
  const latest = useRef({ value, min, max, steps, disabled, reset, onChange });
  latest.current = { value, min, max, steps, disabled, reset, onChange };

  const setLocal = (v: number | null) => {
    localRef.current = v;
    setLocalState(v);
  };
  const shownNow = () => localRef.current ?? latest.current.value;
  const range = () => ({ min: latest.current.min, max: latest.current.max, steps: latest.current.steps });

  const shown = local ?? value;
  const stepped = steps !== undefined && steps.length > 0;
  const lo = stepped ? steps[0] : min;
  const hi = stepped ? steps[steps.length - 1] : max;
  const f = fraction({ value: shown, min, max, steps });
  const box = fillBox(f, bipolar);
  const pct = Math.round(f * 100);
  const text: [string, string] = disabled
    ? ['—', '']
    : kind === 'display' && local !== null
      ? [String(local), '']
      : formatValue(kind, shown, display);
  const ariaName = name ?? label;
  const [v, unit] = text;
  const base = disabled ? `${ariaName}, ${absent}` : `${ariaName} ${v}${unit ? (/^[A-Za-z]/.test(unit) ? ' ' : '') + unit : ''}`;
  const valueText = `${base}${waiting ? ', hardware fader away' : ''}${suffix}`;

  function release() {
    clearTimeout(hold.current);
    hold.current = undefined;
    setLocal(null);
  }

  /** Keeps the local value until the state matches it, or 500 ms after the last send. */
  function holdLocal() {
    clearTimeout(hold.current);
    hold.current = setTimeout(() => {
      if (drag.current === null) setLocal(null);
    }, 500);
  }

  function send(next: number) {
    lastSent.current = next;
    latest.current.onChange?.(next);
    holdLocal();
  }

  /** A wheel or key edit: shown at once and sent when it differs. */
  function nudge(next: number) {
    if (latest.current.disabled) return;
    if (next === shownNow()) return;
    setLocal(next);
    send(next);
  }

  function flush() {
    frame.current = 0;
    if (pending.current !== null && pending.current !== lastSent.current) send(pending.current);
    pending.current = null;
  }

  // A live edit ends when the state reports the value last sent (or after the hold above).
  useEffect(() => {
    if (local !== null && drag.current === null && lastSent.current !== null && value === lastSent.current) release();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, local]);

  // The wheel needs a non-passive listener to keep the page from scrolling.
  const onWheel = useRef<(event: WheelEvent) => void>(() => {});
  onWheel.current = (event: WheelEvent) => {
    if (event.deltaY === 0) return;
    event.preventDefault();
    nudge(step(shownNow(), event.deltaY < 0 ? 1 : -1, range()));
  };
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const listener = (event: WheelEvent) => onWheel.current(event);
    el.addEventListener('wheel', listener, { passive: false });
    return () => el.removeEventListener('wheel', listener);
  }, []);

  useEffect(
    () => () => {
      if (frame.current !== 0) cancelAnimationFrame(frame.current);
      clearTimeout(hold.current);
    },
    [],
  );

  function pointerDown(event: React.PointerEvent<HTMLSpanElement>) {
    if (disabled || event.button !== 0) return;
    drag.current = { id: event.pointerId, x0: event.clientX, v0: shownNow() };
    lastSent.current = shownNow();
    clearTimeout(hold.current);
    setDragging(true);
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // jsdom and synthetic events have no pointer capture.
    }
  }

  function pointerMove(event: React.PointerEvent<HTMLSpanElement>) {
    const d = drag.current;
    if (d === null || d.id !== event.pointerId) return;
    const delta = Math.trunc((event.clientX - d.x0) / (event.shiftKey ? 8 : 2));
    const next = step(d.v0, delta, range());
    setLocal(next);
    pending.current = next;
    if (frame.current === 0) frame.current = requestAnimationFrame(flush);
  }

  function pointerEnd(event: React.PointerEvent<HTMLSpanElement>) {
    const d = drag.current;
    if (d === null || d.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (frame.current !== 0) cancelAnimationFrame(frame.current);
    frame.current = 0;
    pending.current = null;
    const now = localRef.current;
    if (now !== null && now !== lastSent.current) send(now);
    else if (now === null || now === latest.current.value) release();
    else holdLocal();
  }

  function keyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    let next: number;
    if (event.key in KEY_DELTAS) next = step(shownNow(), KEY_DELTAS[event.key], range());
    else if (event.key === 'Home') next = lo;
    else if (event.key === 'End') next = hi;
    else return;
    event.preventDefault();
    event.stopPropagation();
    nudge(next);
  }

  function doubleClick() {
    if (disabled) return;
    setLocal(reset);
    send(reset);
  }

  const classes = ['yh-bar-readout'];
  if (disabled) classes.push('yh-bar-readout--disabled');
  if (bipolar) classes.push('yh-bar-readout--bipolar');

  return (
    <div className={classes.join(' ')}>
      <span className="yh-bar-readout__label">
        <span className="yh-bar-readout__label-text">{label}</span>
        {waiting && (
          <span className="yh-bar-readout__away" aria-hidden="true">
            ↕
          </span>
        )}
      </span>
      <span
        ref={barRef}
        className="yh-bar-readout__bar"
        role="slider"
        tabIndex={0}
        aria-label={ariaName}
        aria-valuemin={lo}
        aria-valuemax={hi}
        aria-valuenow={disabled ? undefined : shown}
        aria-valuetext={valueText}
        aria-disabled={disabled ? 'true' : undefined}
        data-face={disabled ? 'disabled' : 'off'}
        data-dragging={dragging ? 'true' : undefined}
        data-tip={tip}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
        onKeyDown={keyDown}
        onDoubleClick={doubleClick}
      >
        <span className="yh-bar-readout__track" />
        {bipolar && <span className="yh-bar-readout__centre" />}
        {!disabled && (
          <>
            <span className="yh-bar-readout__fill" style={{ left: `${box.fl}%`, width: `${box.fw}%` }} />
            <span className="yh-bar-readout__cap" style={{ left: `${pct}%` }} />
          </>
        )}
      </span>
      <span className="yh-bar-readout__slot" aria-hidden="true">
        <span className="yh-bar-readout__value">{text[0]}</span>
        {/* Always drawn, empty when there's no unit, so every row's last digit lines up. */}
        <span className="yh-bar-readout__unit">{text[1]}</span>
      </span>
    </div>
  );
}
