// BarReadout's model: its props and the row it draws from them and the input's state (the slider's
// ARIA, the fill and cap, the value and its unit). No framework: `BarReadout.tsx` (React) and
// `BarReadout.svelte` (Svelte) both render `barReadoutView`; the input is a store beside it
// (`barInput.ts`), the maths `bar.ts`.
import type { BarKind } from './bar';
import { fillBox, formatValue, fraction } from './bar';
import type { BarParams, BarState } from './barInput';

export type { BarKind } from './bar';

/** Every BarReadout prop (it takes no framework children). */
export interface BarReadoutModelProps {
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

/** What a renderer draws. */
export interface BarReadoutView {
  /** The row's class. */
  className: string;
  /** The label's text. */
  label: string;
  /** Whether the soft-takeover "↕" shows. */
  waiting: boolean;
  /** The slider's ARIA and `data-*` (beside its class and `tabindex="0"`). */
  slider: Record<string, string | undefined>;
  /** Whether the bipolar centre tick shows. */
  centre: boolean;
  /** The fill's and cap's inline `left` / `width`, or null when disabled (no fill). */
  fill: { left: string; width: string; cap: string } | null;
  /** The value's text and its unit (empty: none, the column still drawn). */
  value: string;
  unit: string;
}

/** The row BarReadout draws from its props and the input's state. */
export function barReadoutView(
  {
    label,
    value,
    min,
    max,
    steps,
    kind = 'number',
    display,
    bipolar = false,
    disabled = false,
    absent = 'not available',
    waiting = false,
    suffix = '',
    name,
    tip,
  }: BarReadoutModelProps,
  { local, dragging }: BarState,
): BarReadoutView {
  const shown = local ?? value;
  const stepped = steps !== undefined && steps.length > 0;
  const lo = stepped ? steps[0] : min;
  const hi = stepped ? steps[steps.length - 1] : max;
  const f = fraction({ value: shown, min, max, steps });
  const box = fillBox(f, bipolar);
  const pct = Math.round(f * 100);
  const [v, unit]: [string, string] = disabled
    ? ['—', '']
    : kind === 'display' && local !== null
      ? [String(local), '']
      : formatValue(kind, shown, display);
  const ariaName = name ?? label;
  const base = disabled ? `${ariaName}, ${absent}` : `${ariaName} ${v}${unit ? (/^[A-Za-z]/.test(unit) ? ' ' : '') + unit : ''}`;
  const classes = ['yh-bar-readout'];
  if (disabled) classes.push('yh-bar-readout--disabled');
  if (bipolar) classes.push('yh-bar-readout--bipolar');
  return {
    className: classes.join(' '),
    label,
    waiting,
    slider: {
      role: 'slider',
      'aria-label': ariaName,
      'aria-valuemin': String(lo),
      'aria-valuemax': String(hi),
      'aria-valuenow': disabled ? undefined : String(shown),
      'aria-valuetext': `${base}${waiting ? ', hardware fader away' : ''}${suffix}`,
      'aria-disabled': disabled ? 'true' : undefined,
      'data-face': disabled ? 'disabled' : 'off',
      'data-dragging': dragging ? 'true' : undefined,
      'data-tip': tip,
    },
    centre: bipolar,
    fill: disabled ? null : { left: `${box.fl}%`, width: `${box.fw}%`, cap: `${pct}%` },
    value: v,
    unit,
  };
}

/** What the input store reads from the props. */
export function barParams({ value, min, max, steps, disabled = false, default: reset, onChange }: BarReadoutModelProps): BarParams {
  return { value, min, max, steps, disabled, reset, onChange };
}
