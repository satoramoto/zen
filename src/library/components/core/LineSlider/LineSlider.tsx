import { snap, useLineSlider, type TipAction } from './useLineSlider';
import { focusRing } from '../../../primitives/Ring';
import './LineSlider.css';

export type { TipAction };
export { snap, useLineSlider };

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
  /** The line's width in px. Default 160. */
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

/**
 * A horizontal value on a Settings page: a line you drag, then the value as a numeral.
 *
 * **Job.** Set one number inside a range (a settle window, a fade time) and read it back at a
 * glance from across the room: the number is what a player looks at, the line says roughly
 * where in the range it sits and that it can be dragged.
 *
 * **Changed.** *Headless* (the materials pass): behaviour lives in `useLineSlider`, and the
 * markup is named parts (`data-part`: root, slider, track, fill, thumb, readout, value, unit)
 * whose look comes from the theme's Materials: the track is a `well`, the thumb a `handle`, and
 * the fill is lit (`--lit`, with `--mat-lit-glow`), so a design system can be tried on without
 * touching the slider. *Numerals*: the value is set in `--font-readout` at `--weight-numeral` with
 * tabular figures, right-aligned in a box sized to the widest value the range can show, so the
 * line never shifts as digits change and a column of sliders lines its numbers up
 * (typography.md, vertical rhythm and alignment). The unit stays small in `--text-3` and is never
 * case-transformed ("ms" is not "MS"). *Affordance*: the hit area is the full `--control-h` tall
 * instead of the compact height, and the 3px cap becomes a real thumb with a ring of the ground
 * colour cut around it so it reads as a separate, grabbable part (craft-details.md, hit targets).
 * *Colour meaning*: the fill is neutral ink because the value belongs to no part; `--accent`
 * appears only on the focus ring and on the thumb while it is focused or dragged, never as
 * decoration (color.md, 60/30/10; anti-ai-slop.md, token role drift). *Contrast*: disabled breaks
 * the track into dashes (the screen's one "shown, not usable" edge), the value in `--text-3`,
 * with a not-allowed cursor. *Proportion* (the 2026-10 review): a 160px default, a 4px track and
 * an `--space-2` thumb, and the value a step above the label size (`--size-label` × 1.25).
 *
 * **Kept.** It is controlled (asks through `onchange`, moves when `value` does), clamps and snaps
 * to the step, and keeps the original's keys (arrows one step, Page Up / Page Down ten, Home and
 * End), drag with pointer capture, and a11y: role `slider`, `aria-valuetext` carrying the unit,
 * disabled still focusable. The one-line, no-label form and the sizes are kept: the row around it
 * names it.
 *
 * **Tuning knobs**
 * - `--yh-lineslider-ground`: the colour of the ring cut around the thumb; a parent on a raised surface sets it to its own face.
 * - `--yh-lineslider-thumb-*` (`-w`, `-h`, `-radius`): the thumb's width, resting height and corner; the track's corner and the hit area's side padding follow them.
 */
export function LineSlider({
  value,
  min = 0,
  max = 127,
  step = 1,
  name,
  valueText,
  unit = '',
  width = 160,
  disabled = false,
  tip,
  tipAction,
  onchange,
}: LineSliderProps) {
  const shown = valueText ?? String(value);
  // Reserve room for the widest value the range can show, so the line never moves.
  const digits = Math.max(shown.length, String(min).length, String(max).length);
  const { fraction, sliderProps, trackRef } = useLineSlider({
    value,
    min,
    max,
    step,
    name,
    valueText: unit ? `${shown} ${unit}` : shown,
    disabled,
    tip,
    tipAction,
    onchange,
  });

  const percent = `${fraction * 100}%`;

  return (
    <span className="yh-lineslider" data-part="root" data-disabled={disabled || undefined}>
      <span
        {...sliderProps}
        className={`yh-lineslider__hit ${focusRing}`}
        data-part="slider"
        style={{ width: `${width}px` }}
        data-tip={tip}
      >
        <span ref={trackRef} className="yh-lineslider__track" data-part="track">
          <span className="yh-lineslider__fill" data-part="fill" style={{ width: percent }} />
          <span className="yh-lineslider__thumb" data-part="thumb" style={{ left: percent }} />
        </span>
      </span>
      <span className="yh-lineslider__readout" data-part="readout" aria-hidden="true">
        <span className="yh-lineslider__value" data-part="value" style={{ minWidth: `${digits}ch` }}>
          {shown}
        </span>
        {unit && (
          <span className="yh-lineslider__unit" data-part="unit">
            {unit}
          </span>
        )}
      </span>
    </span>
  );
}

export default LineSlider;
