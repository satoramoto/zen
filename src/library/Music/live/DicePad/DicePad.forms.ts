// DicePad's forms (docs/assembly.md), in scale units, never measured. `full` is the Follow board's
// happy accidents (six moves, the lock, the macro under a head); `row` is the ONE board's dice row.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type DicePadForm = 'full' | 'row';

export const DICE_PAD_FORMS: Forms<DicePadForm> = [
  {
    id: 'full',
    min: { w: { control: 10 }, h: lengthSum({ control: 1 }, { control: 6 }, { control: 1 }, { control: 1 }, { space: [1, 1, 1, 1] }) },
    ideal: { w: { control: 14 }, h: lengthSum({ control: 1 }, { control: 7.5 }, { control: 1 }, { control: 1 }, { space: [2, 2, 2, 2] }) },
    grow: { w: true },
  },
  {
    id: 'row',
    min: { w: lengthSum({ control: 16 }, { chars: { caption: 10 } }), h: { control: 1 } },
    ideal: { w: lengthSum({ control: 22 }, { chars: { caption: 12 } }), h: { control: 1.5 } },
    grow: { w: true },
  },
];
