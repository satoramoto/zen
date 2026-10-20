// LineSlider's model: its props, the tree it draws from them (classes, `data-*`, ARIA, the lengths
// its inline styles carry, the stores it binds) and the handlers that tree names, and `snap`. No
// framework: `LineSlider.tsx` (React) and `LineSlider.svelte` (Svelte) both pass `lineSliderView`
// and `lineSliderHandlers` to their `Tree`; the drag and the keys are the `slide.ts` store beside
// it, registered as `lineSlider` in `src/library/view/stores.ts`.
import { focusRing } from '../../../primitives/Ring';
import { textNode } from '../../../primitives/Text.model';
import { h, styleText, wire, type Handlers, type Node } from '../../../view/Tree.model';
import type { TipAction } from '../../../view/tip';

/** The app's tooltip action, applied to the slider with its key (same shape as a Svelte action). */
export type { TipAction };

export interface LineSliderModelProps {
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

export const LINE_SLIDER_DEFAULTS = { min: 0, max: 127, step: 1, width: 160 } as const;

/** Snaps to the step grid from `min`, then clamps; `toFixed` drops float dust (0.1 + 0.2). */
export function snap(v: number, min: number, max: number, step: number): number {
  const stepped = Math.round((v - min) / step) * step + min;
  return Math.max(min, Math.min(max, Number(stepped.toFixed(6))));
}

/**
 * The tree LineSlider draws from its props: the root, the slider (the hit area, binding the
 * `lineSlider` store and the tooltip) holding the track, its fill and its thumb, then the readout:
 * the value a `numeral` Text, its min-width reserving the widest value the range can show, and the
 * unit a `caption` one. While a pointer drags, the store marks the slider `data-held`.
 */
export function lineSliderView({
  value,
  min = LINE_SLIDER_DEFAULTS.min,
  max = LINE_SLIDER_DEFAULTS.max,
  step = LINE_SLIDER_DEFAULTS.step,
  name,
  valueText,
  unit = '',
  width = LINE_SLIDER_DEFAULTS.width,
  disabled = false,
  tip,
}: LineSliderModelProps): Node {
  const shown = valueText ?? String(value);
  // Reserve room for the widest value the range can show, so the line never moves.
  const digits = Math.max(shown.length, String(min).length, String(max).length);
  const span = Math.max(step, max - min);
  const fraction = Math.max(0, Math.min(1, (value - min) / span));
  const percent = `${fraction * 100}%`;
  return h(
    'span',
    { class: 'yh-lineslider', 'data-part': 'root', 'data-disabled': disabled ? 'true' : undefined },
    wire(
      h(
        'span',
        {
          class: `yh-lineslider__hit ${focusRing}`,
          role: 'slider',
          tabindex: '0',
          'aria-label': name,
          'aria-valuemin': String(min),
          'aria-valuemax': String(max),
          'aria-valuenow': String(value),
          'aria-valuetext': unit ? `${shown} ${unit}` : shown,
          'aria-disabled': disabled ? 'true' : undefined,
          'data-part': 'slider',
          'data-tip': tip,
          style: styleText({ width: `${width}px` }),
        },
        h(
          'span',
          { class: 'yh-lineslider__track', 'data-part': 'track' },
          h('span', { class: 'yh-lineslider__fill', 'data-part': 'fill', style: styleText({ width: percent }) }),
          h('span', { class: 'yh-lineslider__thumb', 'data-part': 'thumb', style: styleText({ left: percent }) }),
        ),
      ),
      {
        bind: [
          ['lineSlider', { value, min, max, step, disabled, onchange: 'change' }],
          ['tip', { tip, tipAction: 'tipAction' }],
        ],
      },
    ),
    h(
      'span',
      { class: 'yh-lineslider__readout', 'data-part': 'readout', 'aria-hidden': 'true' },
      textNode(
        { role: 'numeral', className: 'yh-lineslider__value' },
        { 'data-part': 'value', style: styleText({ 'min-width': `${digits}ch` }) },
        shown,
      ),
      unit ? textNode({ role: 'caption', leading: 'tight', className: 'yh-lineslider__unit' }, { 'data-part': 'unit' }, unit) : null,
    ),
  );
}

/** The callbacks `lineSliderView`'s tree names: the value asked for, and the app's tooltip action. */
export function lineSliderHandlers(props: LineSliderModelProps): Handlers {
  return { change: props.onchange, tipAction: props.tipAction };
}
