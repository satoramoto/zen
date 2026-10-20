// BarReadout's model: its props and the tree it draws from them and the input's state (the slider's
// ARIA, the fill and cap, the value and its unit). No framework: `BarReadout.tsx` (React) and
// `BarReadout.svelte` (Svelte) both pass `barReadoutView` and `barReadoutHandlers` to their `Tree`;
// the input is the `barInput` store the tree binds (`barInput.ts`), reporting its state to the
// binding's view state, which passes it back; the maths is `bar.ts`.
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { h, styleText, wire, type Handlers, type Node } from '../../../view/Tree.model';
import type { BarKind } from './bar';
import { fillBox, formatValue, fraction } from './bar';
import type { BarState } from './barInput';

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

/** The input's state before any edit: no local value, no drag. */
export const BAR_IDLE: BarState = { local: null, dragging: false };

/** A Text's attributes (its class and `data-*`). */
function text(props: TextModelProps): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs };
}

/**
 * The row BarReadout draws from its props and the input's state (`bar`, the binding's view state):
 * the label (a caption Text, with the soft-takeover "↕"), the slider (binding the `barInput` store,
 * which reports its state to `state` and each value sent to `change`) with its track, centre tick,
 * fill and cap, and the value with its unit column (always drawn, empty when there's no unit).
 */
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
    default: reset,
    disabled = false,
    absent = 'not available',
    waiting = false,
    suffix = '',
    name,
    tip,
  }: BarReadoutModelProps,
  { local, dragging }: BarState = BAR_IDLE,
): Node {
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
  return h(
    'div',
    { class: classes.join(' ') },
    h(
      'span',
      text({ role: 'body', size: 'caption', case: 'label', className: 'yh-bar-readout__label' }),
      h('span', { class: 'yh-bar-readout__label-text' }, label),
      waiting
        ? h('span', { ...text({ role: 'body', size: 'inherit', weight: 'strong', className: 'yh-bar-readout__away' }), 'aria-hidden': 'true' }, '↕')
        : null,
    ),
    wire(
      h(
        'span',
        {
          class: 'yh-bar-readout__bar',
          tabindex: '0',
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
        h('span', { class: 'yh-bar-readout__track' }),
        bipolar ? h('span', { class: 'yh-bar-readout__centre' }) : null,
        disabled ? null : h('span', { class: 'yh-bar-readout__fill', style: styleText({ left: `${box.fl}%`, width: `${box.fw}%` }) }),
        disabled ? null : h('span', { class: 'yh-bar-readout__cap', style: styleText({ left: `${pct}%` }) }),
      ),
      { bind: [['barInput', { value, min, max, steps, disabled, reset, onChange: 'change', onState: 'state' }]] },
    ),
    h(
      'span',
      { class: 'yh-bar-readout__slot', 'aria-hidden': 'true' },
      h('span', text({ role: 'numeral', size: 'body', className: 'yh-bar-readout__value' }), v),
      // Always drawn, empty when there's no unit, so every row's last digit lines up.
      h('span', text({ role: 'body', size: 'caption', className: 'yh-bar-readout__unit' }), unit),
    ),
  );
}

/** The callbacks `barReadoutView`'s tree names: each value sent (`change`), and `state`, where the
 *  `barInput` store reports its state (the binding's view state's `set`). */
export function barReadoutHandlers(props: BarReadoutModelProps, onState: (state: BarState) => void): Handlers {
  return { change: props.onChange, state: onState };
}
