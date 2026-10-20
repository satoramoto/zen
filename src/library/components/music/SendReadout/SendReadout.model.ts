// SendReadout's model: its props and the view it draws (the button's attributes, its spoken name
// and the three sends). No framework: `SendReadout.tsx` (React) and `SendReadout.svelte` (Svelte)
// both render `sendReadoutView`.
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

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

/** A Text part: its Text props (no class), its class and its words. */
export interface SendReadoutTextPart {
  text: TextModelProps;
  className: string;
  content: string;
}

/** One send: its `span`, its name and its level. */
export interface SendReadoutSend extends ElementView {
  word: SendReadoutTextPart;
  level: SendReadoutTextPart;
}

/** What a renderer draws: the button and its three sends. */
export interface SendReadoutView {
  button: ElementView;
  sends: SendReadoutSend[];
}

/** The readout SendReadout draws from its props. */
export function sendReadoutView({ reverb, chorus, delay, label = 'Band', name, tip }: SendReadoutModelProps): SendReadoutView {
  const sends = [
    ['Reverb', reverb],
    ['Chorus', chorus],
    ['Delay', delay],
  ] as const;
  return {
    button: {
      className: 'yh-send-readout',
      attrs: {
        type: 'button',
        'aria-label': name ?? `${label} sends: reverb ${reverb}, chorus ${chorus}, delay ${delay}. Opens Effects`,
        'data-tip': tip,
      },
    },
    sends: sends.map(([word, level]) => ({
      className: 'yh-send-readout-send',
      attrs: { 'data-off': level === 0 ? '' : undefined },
      word: { text: { size: 'label', case: 'label' }, className: 'yh-send-readout-name', content: word },
      level: { text: { role: 'numeral', size: 'label' }, className: 'yh-send-readout-level', content: String(level) },
    })),
  };
}
