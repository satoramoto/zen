// RigHealth's forms (docs/assembly.md): one line of everything, or dots only.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type RigHealthForm = 'strip' | 'dots';

export const RIG_HEALTH_FORMS: Forms<RigHealthForm> = [
  {
    id: 'strip',
    min: { w: lengthSum({ chars: { caption: 110 } }, { control: 3 }), h: { control: 1 } },
    ideal: { w: lengthSum({ chars: { caption: 130 } }, { control: 4 }), h: { control: 1 } },
    grow: { w: true },
  },
  {
    id: 'dots',
    min: { w: lengthSum({ chars: { caption: 40 } }, { control: 2 }), h: { control: 1 } },
    ideal: { w: lengthSum({ chars: { caption: 50 } }, { control: 2 }), h: { control: 1 } },
    grow: { w: true },
  },
];
