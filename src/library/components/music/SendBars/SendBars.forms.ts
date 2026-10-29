// SendBars' forms (docs/assembly.md): two thin horizontal send bars, in scale units. One form:
// two rows of label plus bar, the bars growing across whatever width they are given.
import type { Forms } from '../../../layout/assembly/types';

export type SendBarsForm = 'bars';

/** The send bars' one form: label plus bar twice over, growing across. */
export const SEND_BARS_FORMS: Forms<SendBarsForm> = [
  {
    id: 'bars',
    min: { w: { control: 6 }, h: { control: 2 } },
    ideal: { w: { control: 10 }, h: { control: 2 } },
    grow: { w: true },
  },
];

/** Where the unity hinge sits on each bar, 0–1: the +0 dB detent a finger finds. */
export const SEND_UNITY = 0.75;
