// TempoReadout's model: its props, the tree both renderers draw from them (classes, `data-*`, ARIA
// and the root's custom properties), and the pure tempo arithmetic. No framework: `TempoReadout.tsx`
// (React) and `TempoReadout.svelte` (Svelte) both pass `tempoReadoutView` and
// `tempoReadoutHandlers` to their `Tree`; the drag, wheel, keys and the + / − holds are the
// `tempoNumber` and `tempoStep` stores beside it (`tempoGestures.ts`), the tooltips the kernel `tip`.
import type { TipAction } from '../../core/Button/Button.model';
import { focusRing } from '../../../primitives/Ring';
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { h, styleText, wire, type Handlers, type Node } from '../../../view/Tree.model';

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

/** A Text's attributes (its class and `data-*`). */
function text(props: TextModelProps): Record<string, string | undefined> {
  const view = textView(props);
  return { class: view.className, ...view.attrs };
}

/** One of the + / − keys: a numeral Text drawn as a `<button>`, binding `tempoStep` (reporting to
 *  the handler `report`) and the app's `tip` with its own key. */
const step = (glyph: string, name: string, tip: string, report: string): Node =>
  wire(
    h(
      'button',
      {
        ...text({ role: 'numeral', size: 'heading', tabular: false, className: 'yh-tempo-readout__step' }),
        type: 'button',
        'data-part': 'step',
        'data-material': 'key',
        'aria-label': name,
        'data-tip': tip,
      },
      h('span', { 'aria-hidden': 'true' }, glyph),
    ),
    {
      bind: [
        ['tip', { tip, tipAction: 'tipAction' }],
        ['tempoStep', { report }],
      ],
    },
  );

/**
 * The tree TempoReadout draws: the root (its digit count and size as custom properties), the
 * reading window (a `screen`) with the number (a numeral Text, the spinbutton, binding
 * `tempoNumber` and the app's `tip`) and the unit (a label Text), then the + / − group (a numeral
 * Text) with its two keys.
 */
export function tempoReadoutView({
  bpm,
  unit = 'BPM',
  min = 5,
  max = 500,
  cells = false,
  unitLarge = false,
  tip = 'display.tempo',
  size,
}: TempoReadoutModelProps): Node {
  /** unitLarge only applies with `cells`. */
  const large = cells && unitLarge;
  const digits = Math.max(String(Math.round(max)).length, String(Math.round(bpm)).length);
  const className = ['yh-tempo-readout', cells && 'yh-tempo-readout--cells', large && 'yh-tempo-readout--unit-large'].filter(Boolean).join(' ');
  return h(
    'div',
    {
      class: className,
      'data-part': 'root',
      'data-cells': cells ? 'true' : undefined,
      style: styleText({ '--yh-tempo-readout-digits': String(digits), '--yh-tempo-readout-size': size }),
    },
    h(
      'span',
      { class: 'yh-tempo-readout__reading', 'data-part': 'window', 'data-material': 'screen' },
      wire(
        h(
          'span',
          {
            ...text({ role: 'numeral', ariaRole: 'spinbutton', className: `yh-tempo-readout__bpm ${focusRing}` }),
            'data-part': 'value',
            tabindex: '0',
            'aria-label': `Tempo, ${unit}. Drag, scroll or use the arrow keys; double-click for the style's tempo`,
            'aria-valuenow': String(bpm),
            'aria-valuemin': String(min),
            'aria-valuemax': String(max),
            'aria-valuetext': `${bpm} ${unit}`,
            'data-tip': tip,
          },
          String(bpm),
        ),
        {
          bind: [
            ['tip', { tip, tipAction: 'tipAction' }],
            ['tempoNumber', { bpm, min, max, onTempo: 'tempo', onReset: 'reset' }],
          ],
        },
      ),
      h(
        'span',
        {
          ...text({
            role: 'label',
            size: large ? 'display' : 'caption',
            weight: large ? 'display' : 'body',
            case: large ? 'none' : undefined,
            leading: 'tight',
            className: 'yh-tempo-readout__unit',
          }),
          'data-part': 'unit',
          'aria-hidden': 'true',
        },
        unit,
      ),
    ),
    h(
      'span',
      { ...text({ role: 'numeral', ariaRole: 'group', className: 'yh-tempo-readout__steps' }), 'data-part': 'steps', 'aria-label': 'Tempo' },
      step('+', 'Tempo up (Scene Launch)', 'tempo.up', 'plus'),
      step('−', 'Tempo down (Function)', 'tempo.down', 'minus'),
    ),
  );
}

/** The callbacks `tempoReadoutView`'s tree names: the number's asks, the + / − holds and the app's
 *  tooltip action. */
export function tempoReadoutHandlers(props: TempoReadoutModelProps): Handlers {
  return { tempo: props.onTempo, reset: props.onReset, plus: props.onPlus, minus: props.onMinus, tipAction: props.tipAction };
}
