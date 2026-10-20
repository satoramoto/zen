// StepValue's model: its props, the tree it draws from them (classes, `data-*`, ARIA, the fill its
// inline style carries, the stores it binds) and the handlers that tree names. No framework:
// `StepValue.tsx` (React) and `StepValue.svelte` (Svelte) both pass `stepValueView` and
// `stepValueHandlers` to their `Tree`; the drag, wheel and keys are the `adjust.ts` store beside it,
// registered as `stepAdjust` in `src/library/view/stores.ts`.
import { focusRing } from '../../../primitives/Ring';
import { textNode } from '../../../primitives/Text.model';
import { h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import type { TipAction } from '../../../view/tip';
import type { HueSlot } from '../hue';
import { fraction } from './adjust';

/** The app's tooltip hook-up: called with the element and the tip key; may return an updater and a cleanup. */
export type { TipAction };

/** A categorical hue slot (an app maps its own meaning, e.g. Yahaha's parts), or `t` neutral. */
export type StepHue = 't' | HueSlot;

export interface StepValueModelProps {
  /** The value, in `min`–`max`. */
  value: number;
  min?: number;
  max?: number;
  /** Where a double-click puts it; none: a double-click does nothing. */
  defaultValue?: number;
  /** The value as shown ("16", "+4", "1k"). Default: the number. */
  display?: string;
  /** A short tag before the value ("R2"), marked with its hue. */
  tag?: string;
  /** The tag's hue: a slot `1`–`4` (`--hue-1..4`), or `t` neutral. */
  hue?: StepHue;
  /** `a` a level (shows where it sits in its range), `t` a plain table cell. */
  ink?: 'a' | 't';
  /** Faded (a part that doesn't sound): tag and value at reduced strength. Still settable. */
  dim?: boolean;
  /** Shown, not settable. Stays focusable. */
  disabled?: boolean;
  /** The px a drag across the whole range takes. */
  span?: number;
  /** The slider's accessible name ("Right 2 delay send"). */
  name: string;
  /** The spoken value, when `display` alone isn't enough ("+4 dB"). Default: `display`. */
  valuetext?: string;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
  /** The app's tooltip action, applied with `tip` when both are set. */
  tipAction?: TipAction;
  /** A new whole value, from a drag, a wheel notch, a key or a double-click. */
  onchange?: (value: number) => void;
}

/**
 * The tree StepValue draws from its props: the slider cell (binding the `stepAdjust` store and the
 * tooltip), its tag (a label-case caption Text holding the hue swatch), the value (a numeral Text,
 * body weight in a table cell) and, for a level, the range lamp. `--yh-stepvalue-fill` carries
 * where the value sits; while a pointer drags, the store marks the cell `data-dragging`.
 */
export function stepValueView({
  value,
  min = 0,
  max = 127,
  defaultValue,
  display,
  tag,
  hue = 't',
  ink = 'a',
  dim = false,
  disabled = false,
  span = 128,
  name,
  valuetext,
  tip,
}: StepValueModelProps): Node {
  const shown = display ?? String(value);
  return wire(
    h(
      'span',
      {
        class: `yh-stepvalue ${focusRing}`,
        role: 'slider',
        tabindex: '0',
        'aria-label': name,
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
        'aria-valuenow': String(value),
        'aria-valuetext': valuetext ?? shown,
        'aria-disabled': disabled ? 'true' : undefined,
        'data-ink': ink,
        'data-dim': dim ? 'true' : undefined,
        'data-disabled': disabled ? 'true' : undefined,
        'data-hue': hue === 't' ? undefined : String(hue),
        'data-tip': tip,
        style: styleText({ '--yh-stepvalue-fill': String(fraction(value, min, max)) }),
      },
      when(Boolean(tag), () =>
        textNode(
          { role: 'body', size: 'caption', weight: 'strong', case: 'label', className: 'yh-stepvalue__tag' },
          {},
          h('span', { class: 'yh-stepvalue__swatch', 'aria-hidden': 'true' }),
          tag as string,
        ),
      ),
      // A table cell (`ink` 't') reads in plain body weight, quieter than a level.
      textNode({ role: 'numeral', size: 'label', weight: ink === 't' ? 'body' : undefined, className: 'yh-stepvalue__value' }, {}, shown),
      when(ink === 'a', () => h('span', { class: 'yh-stepvalue__lamp', 'aria-hidden': 'true' })),
    ),
    {
      bind: [
        ['stepAdjust', { value, min, max, defaultValue, disabled, span, onchange: 'change' }],
        ['tip', { tip, tipAction: 'tipAction' }],
      ],
    },
  );
}

/** The callbacks `stepValueView`'s tree names: the new value, and the app's tooltip action. */
export function stepValueHandlers(props: StepValueModelProps): Handlers {
  return { change: props.onchange, tipAction: props.tipAction };
}
