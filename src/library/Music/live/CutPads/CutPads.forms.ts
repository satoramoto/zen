// CutPads' forms (docs/assembly.md): what the transitions need, in scale units, never measured.
// `row` lays every pad in one line; `grid` stacks them in two rows under the pane's head.
import type { Forms } from '../../../layout/assembly';

export type CutPadsForm = 'row' | 'grid';

export const CUT_PADS_FORMS: Forms<CutPadsForm> = [
  {
    id: 'row',
    min: { w: { control: 24 }, h: { control: 2.5 } },
    ideal: { w: { control: 36 }, h: { control: 3 } },
    grow: { w: true },
  },
  {
    id: 'grid',
    min: { w: { control: 12 }, h: { control: 5 } },
    ideal: { w: { control: 18 }, h: { control: 6 } },
    grow: { w: true, h: true },
  },
];
