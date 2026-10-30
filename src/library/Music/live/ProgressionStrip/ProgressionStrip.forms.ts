// ProgressionStrip's forms (docs/assembly.md): what the strip needs, in scale units, never measured.
// `full` draws each chord's name over its notes; `compact` keeps the names in 24px cells.
import type { Forms } from '../../../layout/assembly';

export type ProgressionStripForm = 'full' | 'compact';

export const PROGRESSION_STRIP_FORMS: Forms<ProgressionStripForm> = [
  {
    id: 'full',
    min: { w: { control: 24 }, h: { control: 3.5 } },
    ideal: { w: { control: 36 }, h: { control: 4 } },
    grow: { w: true },
  },
  {
    id: 'compact',
    min: { w: { control: 16 }, h: { control: 3 } },
    ideal: { w: { control: 24 }, h: { control: 3 } },
    grow: { w: true },
  },
];
