// OrbitClock's forms (docs/assembly.md): the orbits beside the generator list and the dice, or the
// orbits alone.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type OrbitClockForm = 'full' | 'orbits';

/** The side column: a generator's name, kind and hint per line, then the four dice keys two by two. */
const SIDE_W = lengthSum({ chars: { label: 22 } }, { space: [3, 3] });

export const ORBIT_CLOCK_FORMS: Forms<OrbitClockForm> = [
  {
    id: 'full',
    min: { w: lengthSum({ control: 8 }, SIDE_W), h: { control: 8 } },
    ideal: { w: lengthSum({ control: 12 }, SIDE_W), h: { control: 12 } },
    grow: { w: true, h: true },
    max: { h: { control: 18 } },
  },
  {
    id: 'orbits',
    min: { w: { control: 6 }, h: { control: 6 } },
    ideal: { w: { control: 10 }, h: { control: 10 } },
    grow: { w: true, h: true },
    max: { h: { control: 16 } },
  },
];
