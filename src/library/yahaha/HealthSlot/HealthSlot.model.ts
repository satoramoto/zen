// HealthSlot's model: its props, the tree it draws from them (the root's classes and data, the live
// words, the button or the calm text, the mark, the text split into words and numerals) and the
// handlers that tree names. No framework: `HealthSlot.tsx` (React) and `HealthSlot.svelte` (Svelte)
// both pass `healthSlotView` and `healthSlotHandlers` to their `Tree`.
import type { TipAction } from '../../components/core/Button/Button.model';
import { textView } from '../../primitives/Text.model';
import { component, h, styleText, wire, type Bind, type Handlers, type Node } from '../../view/Tree.model';
import { health, type HealthTarget } from './health';

export type { HealthTarget } from './health';
export type { TipAction };

/** Every HealthSlot prop (it has no children). */
export interface HealthSlotModelProps {
  /** The first keyboard part (0–3: R1 R2 R3 L) whose plugin failed and isn't missing (`firstFailedPart`). */
  failedPart?: 0 | 1 | 2 | 3 | null;
  /** False when there is no audio (`io.synth` is null). */
  synthOn?: boolean;
  /** Audio dropouts in the last 30 s, counted by the wiring. */
  dropouts?: number;
  /** The buffer in use, in frames (64 … 1024); null when unknown. */
  bufferFrames?: number | null;
  /** The CPU load, 1.0 = the whole buffer; null before the first meters frame. */
  cpu?: number | null;
  /** A fixed width in px. Default: fills its container's width. */
  width?: number;
  /** The tooltip key, as `data-tip` on the button (or the calm text); null turns it off. */
  tip?: string | null;
  /** The app's tooltip action, applied with `tip` to whichever element carries `data-tip`. */
  tipAction?: TipAction;
  /** Called with where to fix the trouble on a click, Enter or Space. */
  onOpen?: (target: HealthTarget) => void;
}

export type HealthState = 'calm' | 'off' | 'trouble';

/** One run of the shown text: words in the label face, or a count in the readout face. */
export interface HealthWord {
  text: string;
  numeral: boolean;
}

/** What the slot shows, decided from the props. */
export interface HealthSlotState {
  /** The hidden polite live region's words. */
  label: string;
  /** The visible text, and the same split into words and numerals (for the button). */
  text: string;
  words: HealthWord[];
  hue: string;
  state: HealthState;
  /** Where a press goes; null when calm (no button). */
  target: HealthTarget | null;
  /** `data-tip` on whichever element shows. */
  tip: string | undefined;
}

/**
 * Splits "CPU 74%" into words and numerals, so the counts can wear the readout face. A digit inside
 * a name ("R3 failed") is part of the name and stays in its face. Empty runs are left out.
 */
export function healthWords(text: string): HealthWord[] {
  return text
    .split(/(?<![\p{L}\d])(\d+%?)/u)
    .map((part, i) => ({ text: part, numeral: i % 2 === 1 }))
    .filter((word) => word.text !== '');
}

/** What the slot shows from its props: the one `health()` choice, its state and its words. */
export function healthSlotState({
  failedPart = null,
  synthOn = true,
  dropouts = 0,
  bufferFrames = null,
  cpu = null,
  tip = 'app.health',
}: HealthSlotModelProps): HealthSlotState {
  const shown = health({ failedPart, synthOn, dropouts, bufferFrames, cpu });
  const state: HealthState = shown.target === null ? 'calm' : shown.hue === 'ending' ? 'trouble' : 'off';
  return {
    label: shown.label,
    text: shown.text,
    words: healthWords(shown.text),
    hue: shown.hue,
    state,
    target: shown.target,
    tip: tip ?? undefined,
  };
}

/**
 * The state's shape. Calm and off are the app bar's status lamp, the same `StatusDot` the
 * Launchkey wears (filled `ok` when fine, a hollow faint ring when there is no audio); trouble is
 * the danger chip's triangle, drawn as StatusLine's error mark.
 */
function mark(state: HealthState): Node {
  return h(
    'span',
    { class: 'yh-health-slot__mark', 'data-part': 'mark', 'data-state': state, 'aria-hidden': 'true' },
    state === 'trouble'
      ? h(
          'svg',
          { class: 'yh-health-slot__triangle', 'data-part': 'triangle', width: '12', height: '12', viewBox: '0 0 12 12' },
          h('path', { d: 'M6 1.5 L11 10.5 H1 Z' }),
          h('path', { d: 'M6 5 V7.4' }),
          h('circle', { cx: '6', cy: '8.9', r: '0.6' }),
        )
      : component('StatusDot', { hue: state === 'calm' ? 'ok' : 'd', hollow: state === 'off' }),
  );
}

/**
 * The tree HealthSlot draws: a `label` Text root with the live region, then the trouble (or off)
 * button with the mark and the words, or the calm mark and text. The tooltip store sits on
 * whichever element carries `data-tip`; a click on the button calls `open` (`healthSlotHandlers`).
 */
export function healthSlotView(props: HealthSlotModelProps): Node {
  const { width } = props;
  const view = healthSlotState(props);
  const label = { role: 'label', weight: 'body', case: 'none', tabular: true } as const;
  const root = textView({ ...label, className: `yh-health-slot${width === undefined ? ' yh-health-slot--fill' : ''}` });
  const tip: { bind: Bind[] } = { bind: [['tip', { tip: view.tip, tipAction: 'tipAction' }]] };
  return h(
    'span',
    {
      class: root.className,
      ...root.attrs,
      'data-part': 'root',
      'data-hue': view.hue,
      'data-state': view.state,
      style: styleText(width === undefined ? undefined : { width: `${width}px` }),
    },
    h('span', { role: 'status', class: 'yh-health-slot__live', 'data-part': 'live' }, view.label),
    view.target
      ? wire(
          h(
            'button',
            {
              class: textView({ ...label, className: 'yh-health-slot__button' }).className,
              ...textView(label).attrs,
              type: 'button',
              'data-part': 'button',
              'data-tip': view.tip,
            },
            mark(view.state),
            h(
              'span',
              { class: 'yh-health-slot__text', 'data-part': 'text' },
              view.words.map((word) => {
                if (!word.numeral) return word.text;
                const num = textView({ role: 'numeral', size: 'inherit', className: 'yh-health-slot__num' });
                return h('span', { class: num.className, ...num.attrs, 'data-part': 'num' }, word.text);
              }),
            ),
          ),
          { on: { click: 'open' }, ...tip },
        )
      : h(
          'span',
          { class: 'yh-health-slot__calm', 'data-part': 'calm' },
          mark(view.state),
          wire(h('span', { class: 'yh-health-slot__text', 'data-part': 'text', 'aria-hidden': 'true', 'data-tip': view.tip }, view.text), tip),
        ),
  );
}

/** The callbacks `healthSlotView`'s tree names: `open` (the button's click: `onOpen` with where to
 *  fix the trouble) and the tooltip's `tipAction`. */
export function healthSlotHandlers(props: HealthSlotModelProps): Handlers {
  return {
    open: () => {
      const { target } = healthSlotState(props);
      if (target) props.onOpen?.(target);
    },
    tipAction: props.tipAction,
  };
}
