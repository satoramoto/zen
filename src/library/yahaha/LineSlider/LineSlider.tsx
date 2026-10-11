import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import './LineSlider.css';

/** The app's tooltip action, applied to the slider with its key (same shape as a Svelte action). */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => void | { update?: (key: string) => void; destroy?: () => void };

export interface LineSliderProps {
  /** The value, between `min` and `max`. */
  value: number;
  min?: number;
  max?: number;
  /** One arrow press; Page Up / Page Down move ten. */
  step?: number;
  /** The accessible name ("Chord settle"). */
  name: string;
  /** The value as shown ("5.0", "Off"). Default: the number. */
  valueText?: string;
  /** The unit after the value, small ("ms", "s", "%"). */
  unit?: string;
  /** The line's width in px. */
  width?: number;
  /** Shown, not movable. Stays focusable and is announced as disabled. */
  disabled?: boolean;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip action; applied with `tip` when both are set. */
  tipAction?: TipAction;
  /** Called with the value asked for (clamped and on a step). Controlled: the line moves when `value` does. */
  onchange?: (value: number) => void;
}

/** Snaps to the step grid from `min`, then clamps; `toFixed` drops float dust (0.1 + 0.2). */
export function snap(v: number, min: number, max: number, step: number): number {
  const stepped = Math.round((v - min) / step) * step + min;
  return Math.max(min, Math.min(max, Number(stepped.toFixed(6))));
}

/**
 * A horizontal value on a Settings page: a line you drag, then the value as a numeral.
 *
 * **Job.** Set one number inside a range (a settle window, a fade time) and read it back at a
 * glance from across the room: the number is what a player looks at, the line says roughly
 * where in the range it sits and that it can be dragged.
 *
 * **Changed.** *Numerals*: the value is set in `--font-readout` at `--weight-numeral` with
 * tabular figures, right-aligned in a box sized to the widest value the range can show, so the
 * line never shifts as digits change and a column of sliders lines its numbers up
 * (typography.md, vertical rhythm and alignment). The unit stays small in `--text-3` and is never
 * case-transformed ("ms" is not "MS"). *Affordance*: the hit area is the full `--control-h` tall
 * instead of the compact height, the rail is visible in every palette (a mix toward `--text-1`
 * rather than the hairline that vanished on light themes), and the 3px cap becomes a real thumb
 * with a ring of the ground colour cut around it so it reads as a separate, grabbable part
 * (craft-details.md, hit targets). *Colour meaning*: the fill and thumb are neutral ink because
 * the value belongs to no part; `--accent` appears only on the focus ring and on the thumb while
 * it is focused or dragged, never as decoration (color.md, 60/30/10 and "structure, not circus";
 * anti-ai-slop.md, token role drift). *Contrast*: disabled draws in `--text-4` with a
 * not-allowed cursor rather than a near-invisible tint.
 *
 * **Kept.** It is controlled (asks through `onchange`, moves when `value` does), clamps and snaps
 * to the step, and keeps the original's keys (arrows one step, Page Up / Page Down ten, Home and
 * End), drag with pointer capture, and a11y: role `slider`, `aria-valuetext` carrying the unit,
 * disabled still focusable. The one-line, no-label form is kept: the row around it names it.
 */
export function LineSlider({
  value,
  min = 0,
  max = 127,
  step = 1,
  name,
  valueText,
  unit = '',
  width = 120,
  disabled = false,
  tip,
  tipAction,
  onchange,
}: LineSliderProps) {
  const span = Math.max(step, max - min);
  const fraction = Math.max(0, Math.min(1, (value - min) / span));
  const shown = valueText ?? String(value);
  // Reserve room for the widest value the range can show, so the line never moves.
  const digits = Math.max(shown.length, String(min).length, String(max).length);

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

  function pointerDown(event: PointerEvent<HTMLSpanElement>) {
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

  function pointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (dragging.current === event.pointerId) fromPointer(event.clientX);
  }

  function pointerEnd(event: PointerEvent<HTMLSpanElement>) {
    if (dragging.current !== event.pointerId) return;
    dragging.current = null;
    setHeld(false);
  }

  function keyDown(event: KeyboardEvent<HTMLSpanElement>) {
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

  const percent = `${fraction * 100}%`;

  return (
    <span className="yh-lineslider" data-disabled={disabled || undefined}>
      <span
        ref={sliderRef}
        className="yh-lineslider__hit"
        role="slider"
        tabIndex={0}
        style={{ width: `${width}px` }}
        aria-label={name}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={unit ? `${shown} ${unit}` : shown}
        aria-disabled={disabled ? 'true' : undefined}
        data-tip={tip}
        data-held={held || undefined}
        onKeyDown={keyDown}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
      >
        <span ref={trackRef} className="yh-lineslider__track">
          <span className="yh-lineslider__fill" style={{ width: percent }} />
          <span className="yh-lineslider__thumb" style={{ left: percent }} />
        </span>
      </span>
      <span className="yh-lineslider__readout" aria-hidden="true">
        <span className="yh-lineslider__value" style={{ minWidth: `${digits}ch` }}>
          {shown}
        </span>
        {unit && <span className="yh-lineslider__unit">{unit}</span>}
      </span>
    </span>
  );
}

export default LineSlider;
