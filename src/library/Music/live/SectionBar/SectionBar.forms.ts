// SectionBar's forms (docs/assembly.md): what the song's sections need, in scale units, never
// measured. `bars` sizes each cell by its bars under the pane's head; `row` is equal cells (the
// Push's row 7); `chip` is one status line for a header or a footer.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type SectionBarForm = 'bars' | 'row' | 'chip';

export const SECTION_BAR_FORMS: Forms<SectionBarForm> = [
  {
    id: 'bars',
    min: { w: { control: 20 }, h: lengthSum({ control: 1 }, { control: 2 }, { space: [1] }) },
    ideal: { w: { control: 36 }, h: lengthSum({ control: 1 }, { control: 2.5 }, { space: [2] }) },
    grow: { w: true },
  },
  {
    id: 'row',
    min: { w: { target: 8 }, h: { target: 1 } },
    ideal: { w: { control: 24 }, h: { control: 1.5 } },
    grow: { w: true },
  },
  {
    id: 'chip',
    min: { w: lengthSum({ chars: { label: 18 } }, { space: [2, 2] }), h: { control: 1 } },
    ideal: { w: lengthSum({ chars: { label: 30 } }, { space: [2, 2] }), h: { control: 1 } },
    grow: { w: true },
  },
];
