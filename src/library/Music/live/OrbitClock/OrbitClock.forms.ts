// OrbitClock's forms (docs/assembly.md): the orbits beside the generator list and the dice, or the
// orbits alone.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type OrbitClockForm = 'full' | 'orbits';

/** The side column: a generator's letter, name, kind and hint per row, then the four dice two by two. */
const SIDE_W = lengthSum({ chars: { caption: 34 } }, { space: [3, 3] });

export const ORBIT_CLOCK_FORMS: Forms<OrbitClockForm> = [
  {
    id: 'full',
    min: { w: lengthSum({ control: 8 }, SIDE_W), h: { control: 9 } },
    ideal: { w: lengthSum({ control: 14 }, SIDE_W), h: { control: 14 } },
    grow: { w: true, h: true },
    max: { h: { control: 20 } },
  },
  {
    id: 'orbits',
    min: { w: { control: 6 }, h: { control: 6 } },
    ideal: { w: { control: 10 }, h: { control: 10 } },
    grow: { w: true, h: true },
    max: { h: { control: 16 } },
  },
];
