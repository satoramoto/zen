// ThrowPads' forms (docs/assembly.md): what the throws need, in scale units, never measured.
// `two-up` sets two pads side by side; `one` draws the first pad alone.
import type { Forms } from '../../../layout/assembly';

export type ThrowPadsForm = 'two-up' | 'one';

export const THROW_PADS_FORMS: Forms<ThrowPadsForm> = [
  {
    id: 'two-up',
    min: { w: { control: 16 }, h: { control: 8 } },
    ideal: { w: { control: 26 }, h: { control: 12 } },
    grow: { w: true, h: true },
  },
  {
    id: 'one',
    min: { w: { control: 8 }, h: { control: 8 } },
    ideal: { w: { control: 13 }, h: { control: 12 } },
    grow: { w: true, h: true },
  },
];
