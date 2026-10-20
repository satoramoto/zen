// Readout's model: its props, the tree it draws from them (classes, ARIA, the bar's fill width,
// the store it binds) and the handlers that tree names. No framework: `Readout.tsx` (React) and
// `Readout.svelte` (Svelte) both pass `readoutView` and `readoutHandlers` to their `Tree`; the drag,
// wheel and keys are the `adjust.ts` store beside it, registered as `readoutAdjust` in
// `src/library/view/stores.ts`.
import { textNode } from '../../../primitives/Text.model';
import { h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { fraction, splitUnit } from './adjust';

export interface ReadoutModelProps {
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
 * The tree Readout draws from its props: the slider row (binding the `readoutAdjust` store) holding
 * the label (a caption Text), the value (the number a numeral Text, the unit a caption one, always
 * drawn so digits align), the knob code column (a `kbd` Text when there is one) and the bar, whose
 * width the store measures as the drag span. While a pointer drags, the store marks the row
 * `data-dragging`.
 */
export function readoutView({
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
}: ReadoutModelProps): Node {
  const shown = display ?? String(value);
  const [number, unit] = splitUnit(shown);
  const fill = disabled ? 0 : fraction(value, min, max);
  return wire(
    h(
      'div',
      {
        class: disabled ? 'yh-readout yh-readout--disabled' : 'yh-readout',
        role: 'slider',
        tabindex: '0',
        'aria-label': name ?? label,
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
        'aria-valuenow': String(value),
        'aria-valuetext': `${label} ${shown}`,
        'aria-disabled': disabled ? 'true' : undefined,
        'data-tip': tip,
      },
      textNode({ role: 'body', size: 'caption', case: 'label', className: 'yh-readout-label' }, {}, label),
      h(
        'span',
        { class: 'yh-readout-value' },
        textNode({ role: 'numeral', size: 'body', className: 'yh-readout-number' }, {}, number),
        // Always drawn, empty when there's no unit, so every row's last digit lines up.
        textNode({ role: 'body', size: 'caption', className: 'yh-readout-unit' }, {}, unit || null),
      ),
      h(
        'span',
        { class: 'yh-readout-code' },
        when(code !== '', () => textNode({ as: 'kbd', role: 'numeral', size: 'caption', weight: 'body' }, {}, code)),
      ),
      h(
        'span',
        { class: 'yh-readout-bar', 'data-part': 'bar', 'aria-hidden': 'true' },
        h('span', { class: 'yh-readout-fill', style: styleText({ width: `${fill * 100}%` }) }),
      ),
    ),
    { bind: [['readoutAdjust', { value, min, max, defaultValue, disabled, onChange: 'change' }]] },
  );
}

/** The callbacks `readoutView`'s tree names: the new value. */
export function readoutHandlers(props: ReadoutModelProps): Handlers {
  return { change: props.onChange };
}
