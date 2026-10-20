// OneTouchPicker's model: its props and the view a renderer draws (the group, its caption, the
// strip and each number's face, spoken name and tooltip key). No framework: `OneTouchPicker.tsx`
// (React) and `OneTouchPicker.svelte` (Svelte) both render `oneTouchPickerView`.
import type { TipAction } from '../../components/core/Button/Button.model';
import type { ElementView, TextModelProps } from '../../primitives/Text.model';

export type { TipAction };

export interface OneTouchPickerProps {
  /** The applied One Touch, 1 to `numbers`; 0 when none is. */
  applied?: number;
  /** How many One Touch settings the style has: numbers past it are disabled. */
  count?: number;
  /** How many numbers to draw. */
  numbers?: number;
  /** The words before the numbers. */
  label?: string;
  /** `horizontal`: label then one strip of numbers. `vertical`: the label on top, the strip under it. */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Cells: no wrapper. The label and each number are top-level elements, 1 + `numbers` of them,
   * each filling its parent's cell; the parent supplies the group role and name.
   */
  cells?: boolean;
  /** Cells: the outlines' and the applied mark's colour, `neutral` or `a` (the style's own colour: a One Touch is a setting of the style). */
  hue?: 'neutral' | 'a';
  /** The group's accessible name. Default: says which is applied and the Launchkey's Shift + pads 9 to 12. */
  name?: string;
  /** Called with 1 to `count` when a number is pressed (applies it at once). */
  onApply?: (n: number) => void;
  /** The app's tooltip action, applied to each number with its own key (`ots.<n>`). */
  tipAction?: TipAction;
}

/** A number's face: `chosen` in the strip, `on` / `disabled` in cells, else `off`. */
export type OneTouchFace = 'off' | 'chosen' | 'on' | 'disabled';

/** One number: a `numeral` Text rendered as a `<button>`. */
export interface OneTouchNumberView extends ElementView {
  /** The One Touch it applies, 1 to `numbers` (also its text). */
  n: number;
  /** The tooltip key (`ots.<n>`), also its `data-tip`. */
  tip: string;
  /** Past the style's count: a disabled button (a boolean, not an attribute string). */
  disabled: boolean;
}

/** What a renderer draws. */
export interface OneTouchPickerView {
  /** No wrapper: the label and the numbers are siblings in the parent's cells. */
  cells: boolean;
  /** The wrapping group `div` (unused in cells). */
  root: ElementView;
  /** The caption: a Text with these props, class and attributes. */
  label: ElementView & { text: TextModelProps; word: string };
  /** The strip `span` around the numbers (unused in cells). */
  strip: ElementView;
  /** Every number's Text props. */
  numberText: TextModelProps;
  numbers: OneTouchNumberView[];
}

/** The group's spoken name: `name`, or which is applied and the Launchkey's pads. */
export function oneTouchGroupName(applied: number, name?: string): string {
  return (
    name ??
    `One Touch Setting (OTS): ${applied ? `${applied} applied` : 'none applied'}. ` + 'Click to apply; on the Launchkey, Shift + pads 9 to 12'
  );
}

/** A number's spoken name, naming its Launchkey pad (Shift + pad 9-12). */
export function oneTouchNumberName(n: number, on: boolean): string {
  return on ? `One Touch ${n}, applied (Shift + pad ${n + 8})` : `Apply One Touch ${n} (Shift + pad ${n + 8})`;
}

/** A number's face. */
export function oneTouchFace(on: boolean, disabled: boolean, cells: boolean): OneTouchFace {
  if (cells) return disabled ? 'disabled' : on ? 'on' : 'off';
  return on ? 'chosen' : 'off';
}

export function oneTouchPickerView({
  applied = 0,
  count = 4,
  numbers = 4,
  label = 'One Touch',
  orientation = 'horizontal',
  cells = false,
  hue = 'neutral',
  name,
}: OneTouchPickerProps): OneTouchPickerView {
  return {
    cells,
    root: {
      className: 'yh-onetouchpicker',
      attrs: { 'data-part': 'root', 'data-orientation': orientation, role: 'group', 'aria-label': oneTouchGroupName(applied, name) },
    },
    label: {
      text: { role: 'caption', case: 'label' },
      word: label,
      className: cells ? 'yh-onetouchpicker__label yh-onetouchpicker__cell' : 'yh-onetouchpicker__label',
      attrs: { 'data-part': 'label', 'aria-hidden': cells ? undefined : 'true' },
    },
    strip: { className: 'yh-onetouchpicker__strip', attrs: { 'data-part': 'strip' } },
    numberText: { role: 'numeral', size: 'label' },
    numbers: Array.from({ length: Math.max(0, numbers) }, (_, i) => {
      const n = i + 1;
      const on = n === applied;
      const disabled = n > count;
      const tip = `ots.${n}`;
      return {
        n,
        tip,
        disabled,
        className: `yh-onetouchpicker__number${cells ? ' yh-onetouchpicker__cell' : ''}`,
        attrs: {
          type: 'button',
          'data-part': 'number',
          'data-material': 'key',
          'aria-pressed': String(on),
          'aria-label': oneTouchNumberName(n, on),
          'data-face': oneTouchFace(on, disabled, cells),
          'data-ink': cells ? hue : undefined,
          'data-tip': tip,
        },
      };
    }),
  };
}
