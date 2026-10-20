// TempoReadout's model: its props, the view it draws from them (classes, `data-*`, ARIA and the
// root's custom properties), and the pure tempo arithmetic. No framework: `TempoReadout.tsx`
// (React) and `TempoReadout.svelte` (Svelte) both render `tempoReadoutView`; the drag, wheel, keys
// and the + / − holds are the store beside it (`tempoGestures.ts`).
import type { TipAction } from '../../core/Button/Button.model';
import { focusRing } from '../../../primitives/Ring';
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

export type { TipAction };

export interface TempoReadoutModelProps {
  /** Beats per minute. */
  bpm: number;
  /** The unit after the number. */
  unit?: string;
  /** The lowest tempo a drag, scroll or key asks for. */
  min?: number;
  /** The highest tempo a drag, scroll or key asks for. */
  max?: number;
  /** Called with the tempo a drag, scroll or key on the number asks for (within `min`–`max`). */
  onTempo?: (bpm: number) => void;
  /** Tempo + held (`true`) and released (`false`). */
  onPlus?: (down: boolean) => void;
  /** Tempo − held and released, as `onPlus`. */
  onMinus?: (down: boolean) => void;
  /** The number double-clicked: back to the style's own tempo. */
  onReset?: () => void;
  /** Fill the size container it sits in: the number on its foot, + over − as one column beside it. */
  cells?: boolean;
  /** With `cells`: the unit set large, in the numeral's ink, rather than as a small label. */
  unitLarge?: boolean;
  /** The number's tooltip key, rendered as its `data-tip`. Default `display.tempo`. */
  tip?: string;
  /**
   * The app's tooltip action (`use:tip`), applied to the number with `tip` and to + and − with
   * their own keys (`tempo.up`, `tempo.down`), as the original does.
   */
  tipAction?: TipAction;
  /**
   * The numeral's size, a CSS length ("96px", "var(--size-display)"), set as
   * `--yh-tempo-readout-size` on the root; it wins over the `cells` fit. Default: that property's
   * value, `--size-numeral` (or the container fit with `cells`).
   */
  size?: string;
}

/** Pixels of drag per BPM. */
export const DRAG_PX = 4;

/** The keys that step the number, and by how much. */
export const STEP_KEYS: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 };

/** A tempo rounded and held within `min`–`max`. */
export const clampTempo = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

/** A Text element's view: its Text props, its class and its other attributes. */
export interface TextPartView extends ElementView {
  text: TextModelProps;
}

/** One of the + / − keys: its element view, its glyph and its tooltip key. */
export interface TempoStepView extends TextPartView {
  glyph: string;
  tip: string;
}

/** What a renderer draws. */
export interface TempoReadoutView {
  /** The root `<div>`: class, `data-*`, and its custom properties (`style`). */
  root: ElementView & { style: Record<string, string> };
  /** The reading window `<span>`. */
  window: ElementView;
  /** The number (a numeral Text, the spinbutton) and its text. */
  value: TextPartView & { label: string; tip: string };
  /** The unit (a label Text). */
  unit: TextPartView & { label: string };
  /** The + / − group (a numeral Text). */
  steps: TextPartView;
  /** Tempo + then Tempo − (numeral Texts rendered as `<button>`). */
  plus: TempoStepView;
  minus: TempoStepView;
}

const step = (glyph: string, name: string, tip: string): TempoStepView => ({
  text: { role: 'numeral', size: 'heading', tabular: false },
  className: 'yh-tempo-readout__step',
  attrs: { type: 'button', 'data-part': 'step', 'data-material': 'key', 'aria-label': name, 'data-tip': tip },
  glyph,
  tip,
});

/** The readout TempoReadout draws from its props. */
export function tempoReadoutView({
  bpm,
  unit = 'BPM',
  min = 5,
  max = 500,
  cells = false,
  unitLarge = false,
  tip = 'display.tempo',
  size,
}: TempoReadoutModelProps): TempoReadoutView {
  /** unitLarge only applies with `cells`. */
  const large = cells && unitLarge;
  const digits = Math.max(String(Math.round(max)).length, String(Math.round(bpm)).length);
  const className = ['yh-tempo-readout', cells && 'yh-tempo-readout--cells', large && 'yh-tempo-readout--unit-large'].filter(Boolean).join(' ');
  return {
    root: {
      className,
      attrs: { 'data-part': 'root', 'data-cells': cells ? 'true' : undefined },
      style: { '--yh-tempo-readout-digits': String(digits), ...(size === undefined ? {} : { '--yh-tempo-readout-size': size }) },
    },
    window: { className: 'yh-tempo-readout__reading', attrs: { 'data-part': 'window', 'data-material': 'screen' } },
    value: {
      text: { role: 'numeral', ariaRole: 'spinbutton' },
      className: `yh-tempo-readout__bpm ${focusRing}`,
      attrs: {
        'data-part': 'value',
        tabindex: '0',
        'aria-label': `Tempo, ${unit}. Drag, scroll or use the arrow keys; double-click for the style's tempo`,
        'aria-valuenow': String(bpm),
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
        'aria-valuetext': `${bpm} ${unit}`,
        'data-tip': tip,
      },
      label: String(bpm),
      tip,
    },
    unit: {
      text: {
        role: 'label',
        size: large ? 'display' : 'caption',
        weight: large ? 'display' : 'body',
        case: large ? 'none' : undefined,
        leading: 'tight',
      },
      className: 'yh-tempo-readout__unit',
      attrs: { 'data-part': 'unit', 'aria-hidden': 'true' },
      label: unit,
    },
    steps: {
      text: { role: 'numeral', ariaRole: 'group' },
      className: 'yh-tempo-readout__steps',
      attrs: { 'data-part': 'steps', 'aria-label': 'Tempo' },
    },
    plus: step('+', 'Tempo up (Scene Launch)', 'tempo.up'),
    minus: step('−', 'Tempo down (Function)', 'tempo.down'),
  };
}

/** Custom properties as an inline `style` string (`--a: 1; --b: 2`), for renderers that take one. */
export const styleText = (style: Record<string, string>) =>
  Object.entries(style)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
