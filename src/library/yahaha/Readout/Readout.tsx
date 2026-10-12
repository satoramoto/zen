import { useRef } from 'react';
import { fraction, splitUnit, useAdjust } from './adjust';
import './Readout.css';

export interface ReadoutProps {
  /** The word at the left ("Feedback"); also the slider's accessible name. */
  label: string;
  /** The value, in `min`–`max`. */
  value: number;
  min?: number;
  max?: number;
  /** Where a double-click puts it; none: a double-click does nothing. */
  defaultValue?: number;
  /** The value as shown, unit included ("38%", "5.0 kHz", "1/8"); the unit is drawn smaller. Default: the number. */
  display?: string;
  /** The Launchkey knob that moves it ("K6"); empty: none. */
  code?: string;
  /** Shown, not settable: the label and value fade, the bar empties, nothing is sent. Stays focusable. */
  disabled?: boolean;
  /** The accessible name when the label alone isn't enough ("Delay feedback"). Default: the label. */
  name?: string;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** A new whole value, from a drag, a wheel notch, a key or a double-click. */
  onChange?: (value: number) => void;
}

/**
 * Readout: the Effects page's parameter control, a labelled value with a bar.
 *
 * **Job.** Show one effect parameter so a player reads its value at a glance, and let them set it
 * without a slider on screen: press anywhere and drag sideways (the bar's width stands for the whole
 * range), a wheel notch or an arrow key steps it, Page Up / Down by ten steps, Home and End to the
 * ends, a double-click back to its default. Controlled: it asks for a new value through `onChange`.
 *
 * **Changed.** *Hierarchy:* the value is now the loudest thing in the row, drawn in primary text at
 * body size in the readout face and numeral weight, the label the Stage's one caption (caption
 * size, body weight, `--text-3`, label case) beside it: the same type recipe as BarReadout, so the
 * two label-bar-value rows read as one family; the original drew the value in the accent at the
 * same size as the label. *Colour meaning:* the accent is kept for the one thing that shows amount,
 * the bar's fill, so a page of readouts reads as a column of levels rather than a column of
 * coloured numbers; the number no longer turns accent while dragged, since numbers never wear it
 * elsewhere (color.md, 60/30/10 and "Component Color Limit"). *Numerals:* tabular figures in a
 * fixed `ch` width, right-aligned, and the unit in a fixed column drawn even when empty, so "9%"
 * → "10%" never shifts the row and "38%", "1/8" and "5.0 kHz" align on their last digit, even
 * under packs whose readout face is proportional (typography.md, "Tabular Numbers"); the knob code
 * is in the readout face too, never mono. *Affordance:* the bar runs the full width under label
 * and value, so the drag span is as wide as the row, grows a little on hover and while dragging,
 * and the knob code is a small framed key cap rather than loose text. *State clarity:* disabled
 * draws the bar and key cap dashed and its text in `--text-3`, never the faint `--text-4`.
 * *Contrast:* the track is a tint of the text colour, so it shows on light and dark palettes alike;
 * focus is a `:focus-visible` ring in the accent (craft-details.md, "Focus States").
 *
 * **Kept.** One compact hairline row per parameter with an empty code column when no knob moves it,
 * so rows line up; the unit split off the number and drawn smaller; every input and the slider's
 * role, name, `aria-valuetext` ("Feedback 38%") and disabled-but-focusable behaviour.
 */
export function Readout({
  label,
  value,
  min = 0,
  max = 127,
  defaultValue,
  display,
  code = '',
  disabled = false,
  name,
  tip,
  onChange,
}: ReadoutProps) {
  const bar = useRef<HTMLSpanElement>(null);
  const ref = useAdjust<HTMLDivElement>({
    value,
    min,
    max,
    defaultValue,
    disabled,
    span: () => bar.current?.getBoundingClientRect().width || 96,
    onChange,
  });

  const shown = display ?? String(value);
  const [number, unit] = splitUnit(shown);
  const fill = disabled ? 0 : fraction(value, min, max);

  return (
    <div
      ref={ref}
      className={disabled ? 'yh-readout yh-readout--disabled' : 'yh-readout'}
      role="slider"
      tabIndex={0}
      aria-label={name ?? label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${label} ${shown}`}
      aria-disabled={disabled ? 'true' : undefined}
      data-tip={tip}
    >
      <span className="yh-readout-label">{label}</span>
      <span className="yh-readout-value">
        <span className="yh-readout-number">{number}</span>
        {/* Always drawn, empty when there's no unit, so every row's last digit lines up. */}
        <span className="yh-readout-unit">{unit}</span>
      </span>
      <span className="yh-readout-code">{code && <kbd>{code}</kbd>}</span>
      <span ref={bar} className="yh-readout-bar" data-part="bar" aria-hidden="true">
        <span className="yh-readout-fill" style={{ width: `${fill * 100}%` }} />
      </span>
    </div>
  );
}
