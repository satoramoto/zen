// LaunchGrid's forms (docs/assembly.md): what the session grid needs, in scale units, never
// measured. `full` lists the set's songs over the grid; `rows` is the grid alone (slot rows, the
// stop row and the loop), for a surface that holds the set elsewhere.
import { lengthMax, lengthSum, type Forms, type Length } from '../../../layout/assembly';
import type { Step } from '../../../primitives/step';

export type LaunchGridForm = 'full' | 'rows';

/** One track column's least width: a glyph and a short loop name. */
const COLUMN: Length = lengthMax({ target: 1 }, { chars: { caption: 6 } });
/** The slot-number column and the rule beside it. */
const AXIS: Length = { control: 2 };

const across = (tracks: number): Length => lengthSum(AXIS, ...Array<Length>(tracks).fill(COLUMN), { space: Array<Step>(tracks).fill(1) });

/** The axis row, `rows` slot rows, the stop row and the loop's line. */
const grid = (rows: number): Length => lengthSum({ lines: { caption: 1 } }, ...Array<Length>(rows + 1).fill({ control: 1 }), { lines: { caption: 1 } }, { space: Array<Step>(rows + 2).fill(1) });

/** Four folded songs. */
const SONGS: Length = lengthSum(...Array<Length>(4).fill({ lines: { label: 1 } }), { space: [3] });

export const LAUNCH_GRID_FORMS: Forms<LaunchGridForm> = [
  {
    id: 'full',
    min: { w: across(8), h: lengthSum(SONGS, grid(4)) },
    ideal: { w: across(10), h: lengthSum(SONGS, grid(8)) },
    grow: { w: true, h: true },
  },
  {
    id: 'rows',
    min: { w: across(8), h: grid(4) },
    ideal: { w: across(10), h: grid(8) },
    grow: { w: true, h: true },
  },
];
