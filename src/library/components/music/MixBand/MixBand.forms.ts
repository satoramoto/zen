// MixBand's forms (docs/assembly.md): a column-aligned band of strips, in scale units. `tall`
// keeps the faders' travel; `short` keeps every concept (name, level, sends, three lamps) with
// the travel FaderBank's `short` allows. The Region's plate is the solver's.
import { lengthMax, lengthSum, type Forms, type Length } from '../../../layout/assembly';
import type { Step } from '../../../primitives/step';

export type MixBandForm = 'tall' | 'short';

/** One strip's least width: a fader, its sends and its lamps, never under three controls. */
const STRIP_W: Length = lengthMax({ target: 1 }, { control: 3 });
/** The gap between strips. */
const GAP: Step = 1;

function bandWidth(strips: number): Length {
  const gaps: Step[] = Array<Step>(Math.max(0, strips - 1)).fill(GAP);
  return lengthSum(...Array<Length>(strips).fill(STRIP_W), { space: gaps });
}

/**
 * The band's forms, most room first:
 *
 * - `tall`: the board's strips, the travel growing with the room.
 * - `short`: the same strips and keys, every step tighter (FaderBank's `short` proportions).
 */
export const MIX_BAND_FORMS: Forms<MixBandForm> = [
  {
    id: 'tall',
    min: { w: bandWidth(8), h: { control: 14 } },
    ideal: { w: bandWidth(10), h: { control: 18 } },
    grow: { w: true, h: true },
  },
  {
    id: 'short',
    min: { w: bandWidth(8), h: { control: 10 } },
    ideal: { w: bandWidth(10), h: { control: 12 } },
    grow: { w: true },
  },
];
