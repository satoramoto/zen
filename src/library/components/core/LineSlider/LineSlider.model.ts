// LineSlider's model: its props, the view it draws from them (classes, `data-*`, ARIA and the
// lengths its inline styles carry), and `snap`. No framework: `LineSlider.tsx` (React) and
// `LineSlider.svelte` (Svelte) both render `lineSliderView`; the drag and the keys are the
// `slide.ts` store beside it.
import { focusRing } from '../../../primitives/Ring';
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

/** The app's tooltip action, applied to the slider with its key (same shape as a Svelte action). */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => void | { update?: (key: string) => void; destroy?: () => void };

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

/** What a renderer draws. Each `style` field is one inline length (a CSS string). */
export interface LineSliderView {
  /** 0–1: where the value sits in the range. */
  fraction: number;
  root: ElementView;
  /** The slider element (the hit area): its class, role, ARIA, tabindex, `data-*`; its width. */
  slider: ElementView & { width: string };
  track: ElementView;
  /** The fill's width and the thumb's left, both the fraction as a percent. */
  fill: ElementView & { width: string };
  thumb: ElementView & { left: string };
  readout: ElementView;
  /** The value: a `numeral` Text, its min-width reserving the widest value the range can show. */
  value: ElementView & { text: TextModelProps; minWidth: string; shown: string };
  /** The unit: a `caption` Text with tight leading; null for none. */
  unit: (ElementView & { text: TextModelProps; shown: string }) | null;
}

/** The view LineSlider draws from its props; `held` is the store's (a pointer is dragging). */
export function lineSliderView(
  {
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
  }: LineSliderModelProps,
  held = false,
): LineSliderView {
  const shown = valueText ?? String(value);
  // Reserve room for the widest value the range can show, so the line never moves.
  const digits = Math.max(shown.length, String(min).length, String(max).length);
  const span = Math.max(step, max - min);
  const fraction = Math.max(0, Math.min(1, (value - min) / span));
  const percent = `${fraction * 100}%`;
  return {
    fraction,
    root: { className: 'yh-lineslider', attrs: { 'data-part': 'root', 'data-disabled': disabled ? 'true' : undefined } },
    slider: {
      className: `yh-lineslider__hit ${focusRing}`,
      attrs: {
        role: 'slider',
        tabindex: '0',
        'aria-label': name,
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
        'aria-valuenow': String(value),
        'aria-valuetext': unit ? `${shown} ${unit}` : shown,
        'aria-disabled': disabled ? 'true' : undefined,
        'data-held': held ? 'true' : undefined,
        'data-part': 'slider',
        'data-tip': tip,
      },
      width: `${width}px`,
    },
    track: { className: 'yh-lineslider__track', attrs: { 'data-part': 'track' } },
    fill: { className: 'yh-lineslider__fill', attrs: { 'data-part': 'fill' }, width: percent },
    thumb: { className: 'yh-lineslider__thumb', attrs: { 'data-part': 'thumb' }, left: percent },
    readout: { className: 'yh-lineslider__readout', attrs: { 'data-part': 'readout', 'aria-hidden': 'true' } },
    value: {
      className: 'yh-lineslider__value',
      attrs: { 'data-part': 'value' },
      text: { role: 'numeral' },
      minWidth: `${digits}ch`,
      shown,
    },
    unit: unit
      ? { className: 'yh-lineslider__unit', attrs: { 'data-part': 'unit' }, text: { role: 'caption', leading: 'tight' }, shown: unit }
      : null,
  };
}
