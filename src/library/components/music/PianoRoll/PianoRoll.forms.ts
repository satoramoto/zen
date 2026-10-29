// PianoRoll's forms (docs/assembly.md): a compact keyboard and note timeline, in scale units.
// `full` keeps the key labels and the bar numbers; `compact` keeps the grid and the notes for a
// strip showing what a clip holds. The Region's plate is the solver's.
import type { Forms } from '../../../layout/assembly/types';

export type PianoRollForm = 'full' | 'compact';

/**
 * The roll's forms, most room first:
 *
 * - `full`: labelled keys, the grid with bar and beat ruling, notes and bar numbers.
 * - `compact`: the grid and the notes alone.
 */
export const PIANO_ROLL_FORMS: Forms<PianoRollForm> = [
  {
    id: 'full',
    min: { w: { control: 10 }, h: { control: 5 } },
    ideal: { w: { control: 18 }, h: { control: 8 } },
    grow: { w: true, h: true },
  },
  {
    id: 'compact',
    min: { w: { control: 6 }, h: { control: 3 } },
    ideal: { w: { control: 10 }, h: { control: 4 } },
    grow: { w: true, h: true },
  },
];
