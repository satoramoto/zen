// LandingDial's forms (docs/assembly.md): the countdown ring over what it lands on and its
// switches, or a one-line chip.
import { lengthMax, lengthSum, type Forms } from '../../../layout/assembly';

export type LandingDialForm = 'dial' | 'chip';

const SWITCHES_W = { chars: { label: 30 } } as const;
const SWITCHES_H = lengthSum({ control: 3 }, { lines: { caption: 4 } }, { space: [2, 2] });

export const LANDING_DIAL_FORMS: Forms<LandingDialForm> = [
  {
    id: 'dial',
    min: { w: lengthMax({ control: 6 }, SWITCHES_W), h: lengthSum({ control: 5 }, SWITCHES_H) },
    ideal: { w: lengthMax({ control: 8 }, SWITCHES_W), h: lengthSum({ control: 8 }, SWITCHES_H) },
    grow: { w: true, h: true },
    max: { h: { control: 16 } },
  },
  {
    id: 'chip',
    min: { w: lengthSum({ control: 1 }, { chars: { label: 18 } }, { space: [2, 2] }), h: { control: 1 } },
    ideal: { w: lengthSum({ control: 1 }, { chars: { label: 26 } }, { space: [2, 2] }), h: { control: 1 } },
    grow: { w: true },
  },
];
