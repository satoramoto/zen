// ChordCompass's forms (docs/assembly.md): the wheel with its readout column beside it, or the
// dial alone with the chord in its hub. The wheel is round, so both keep their aspect.
import { lengthSum, type Forms } from '../../../layout/assembly';

export type ChordCompassForm = 'wheel' | 'dial';

/** The readout column: the head row, the chord in big mono, its notes, the follow switch and the lock. */
const READOUT_W = lengthSum({ chars: { label: 16 } }, { space: [3, 3] });

export const CHORD_COMPASS_FORMS: Forms<ChordCompassForm> = [
  {
    id: 'wheel',
    min: { w: lengthSum({ control: 7 }, READOUT_W), h: { control: 7 } },
    ideal: { w: lengthSum({ control: 11 }, READOUT_W), h: { control: 11 } },
    grow: { w: true, h: true },
    max: { h: { control: 16 } },
  },
  {
    id: 'dial',
    min: { w: { control: 6 }, h: { control: 6 } },
    ideal: { w: { control: 9 }, h: { control: 9 } },
    grow: { w: true, h: true },
    max: { h: { control: 14 } },
  },
];
