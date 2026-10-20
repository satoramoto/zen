// SendReadout's model: its props and the tree both renderers draw from them (the button's
// attributes, its spoken name and the three sends). No framework: `SendReadout.tsx` (React) and
// `SendReadout.svelte` (Svelte) both pass `sendReadoutView` and `sendReadoutHandlers` to their `Tree`.
import { textView, type TextModelProps } from '../../../primitives/Text.model';
import { each, h, wire, type Handlers, type Node } from '../../../view/Tree.model';

export interface SendReadoutModelProps {
  /** The reverb send, 0-127. */
  reverb: number;
  /** The chorus send, 0-127. */
  chorus: number;
  /** The delay send, 0-127. */
  delay: number;
  /** The lead word ("Band"): it starts the spoken name; not drawn (the Effects page it opens says whose sends). */
  label?: string;
  /** The accessible name. Default: "Band sends: reverb 40, chorus 12, delay 0. Opens Effects". */
  name?: string;
  /** The tooltip key, set as `data-tip`. */
  tip?: string;
  /** Called on a click, Space or Enter (opens Effects). */
  onPress?: () => void;
}

/** A Text span: its class and `data-*`, and its words. */
function text(props: TextModelProps, content: string): Node {
  const view = textView(props);
  return h('span', { class: view.className, ...view.attrs }, content);
}

/** The tree SendReadout draws: the button (its click is `press`) and its three sends, each a name
 *  and a level, a send at 0 marked `data-off`. */
export function sendReadoutView({ reverb, chorus, delay, label = 'Band', name, tip }: SendReadoutModelProps): Node {
  const sends = [
    ['Reverb', reverb],
    ['Chorus', chorus],
    ['Delay', delay],
  ] as const;
  return wire(
    h(
      'button',
      {
        class: 'yh-send-readout',
        type: 'button',
        'aria-label': name ?? `${label} sends: reverb ${reverb}, chorus ${chorus}, delay ${delay}. Opens Effects`,
        'data-tip': tip,
      },
      each(
        sends,
        ([word]) => word,
        ([word, level]) =>
          h(
            'span',
            { class: 'yh-send-readout-send', 'data-off': level === 0 ? '' : undefined },
            text({ size: 'label', case: 'label', className: 'yh-send-readout-name' }, word),
            text({ role: 'numeral', size: 'label', className: 'yh-send-readout-level' }, String(level)),
          ),
      ),
    ),
    { on: { click: 'press' } },
  );
}

/** The callback `sendReadoutView`'s tree names: the press. */
export function sendReadoutHandlers(props: SendReadoutModelProps): Handlers {
  return { press: () => props.onPress?.() };
}
