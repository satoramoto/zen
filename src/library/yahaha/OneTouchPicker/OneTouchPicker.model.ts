// OneTouchPicker's model: its props and the trees it draws (the group, its caption, the strip and
// each number's face, spoken name and tooltip). No framework: `OneTouchPicker.tsx` (React) and
// `OneTouchPicker.svelte` (Svelte) both draw `oneTouchPickerView`'s roots with `Tree`, and
// `oneTouchPickerHandlers` for the callbacks they name.
import type { TipAction } from '../../view/tip';
import { textView } from '../../primitives/Text.model';
import { each, h, wire, type Handlers, type Node } from '../../view/Tree.model';

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

/** The handler key a number's click calls: `apply<n>`. */
const applyKey = (n: number) => `apply${n}`;

/**
 * The trees OneTouchPicker draws, each a root its renderer draws with `Tree`: the group `div` (the
 * caption Text, then the strip of numbers), or in `cells` no wrapper, the caption and each number
 * as top-level siblings (keys `label` and `<n>`). Each number is a `numeral` Text as a `<button>`;
 * a click calls `apply<n>` and the tooltip store applies `tipAction` with its key `ots.<n>`.
 */
export function oneTouchPickerView({
  applied = 0,
  count = 4,
  numbers = 4,
  label = 'One Touch',
  orientation = 'horizontal',
  cells = false,
  hue = 'neutral',
  name,
}: OneTouchPickerProps): Node[] {
  const caption = textView({ role: 'caption', case: 'label', className: cells ? 'yh-onetouchpicker__label yh-onetouchpicker__cell' : 'yh-onetouchpicker__label' });
  const numeral = textView({ role: 'numeral', size: 'label', className: `yh-onetouchpicker__number${cells ? ' yh-onetouchpicker__cell' : ''}` });
  const labelNode: Node = {
    ...h('span', { class: caption.className, ...caption.attrs, 'data-part': 'label', 'aria-hidden': cells ? undefined : 'true' }, label),
    key: 'label',
  };
  const all = Array.from({ length: Math.max(0, numbers) }, (_, i) => i + 1);
  const buttons = each(
    all,
    (n) => String(n),
    (n) => {
      const on = n === applied;
      const disabled = n > count;
      const tip = `ots.${n}`;
      return wire(
        h(
          'button',
          {
            class: numeral.className,
            ...numeral.attrs,
            type: 'button',
            'data-part': 'number',
            'data-material': 'key',
            'aria-pressed': String(on),
            'aria-label': oneTouchNumberName(n, on),
            'data-face': oneTouchFace(on, disabled, cells),
            'data-ink': cells ? hue : undefined,
            'data-tip': tip,
            disabled: disabled ? '' : undefined,
          },
          String(n),
        ),
        { on: { click: applyKey(n) }, bind: [['tip', { tip, tipAction: 'tipAction' }]] },
      );
    },
  );
  if (cells) return [labelNode, ...buttons];
  return [
    {
      ...h(
        'div',
        {
          class: 'yh-onetouchpicker',
          'data-part': 'root',
          'data-orientation': orientation,
          role: 'group',
          'aria-label': oneTouchGroupName(applied, name),
        },
        labelNode,
        h('span', { class: 'yh-onetouchpicker__strip', 'data-part': 'strip' }, buttons),
      ),
      key: 'root',
    },
  ];
}

/** The callbacks `oneTouchPickerView`'s trees name: `apply<n>` for each number (calls `onApply(n)`)
 *  and the tooltip's `tipAction`. */
export function oneTouchPickerHandlers({ numbers = 4, onApply, tipAction }: OneTouchPickerProps): Handlers {
  const handlers: Handlers = { tipAction };
  for (let n = 1; n <= numbers; n++) handlers[applyKey(n)] = () => onApply?.(n);
  return handlers;
}
