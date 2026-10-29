// Transport's forms (docs/assembly.md): the play row, in scale units. `bar` keeps play, stop,
// loop, tempo and the reading; `compact` keeps play and the reading for a strip too narrow for
// tempo. The Region's plate is the solver's.
import type { Forms } from '../../../layout/assembly/types';

export type TransportForm = 'bar' | 'compact';

/**
 * The transport's forms, most room first:
 *
 * - `bar`: the whole row — play, stop, loop, tempo and the position reading.
 * - `compact`: play and the reading alone, for a strip holding tempo elsewhere.
 */
export const TRANSPORT_FORMS: Forms<TransportForm> = [
  {
    id: 'bar',
    min: { w: { control: 14 }, h: { control: 1 } },
    ideal: { w: { control: 20 }, h: { control: 1 } },
    grow: { w: true },
  },
  {
    id: 'compact',
    min: { w: { control: 7 }, h: { control: 1 } },
    ideal: { w: { control: 9 }, h: { control: 1 } },
    grow: { w: true },
  },
];
