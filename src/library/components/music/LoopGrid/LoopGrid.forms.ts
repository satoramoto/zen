// LoopGrid's forms (docs/assembly.md): a folded set over eight track columns, in scale units.
// `full` keeps the song headers; `rows` drops them and shows the open song's tracks plus the stop
// row. The Region's plate is the solver's.
import { lengthMax, lengthSum, type Forms, type Length } from '../../../layout/assembly';
import type { Step } from '../../../primitives/step';

export type LoopGridForm = 'full' | 'rows';

/** One track column's least width: a hue mark, a short name and a pie, never under a target. */
const TRACK_W: Length = lengthMax({ target: 1 }, { control: 3 });
/** The gap between track columns. */
const GAP: Step = 1;

/** Eight track columns across (the widest `cells.length`, never fewer than eight), and the gaps. */
function columnsWidth(tracks: number): Length {
  const gaps: Step[] = Array<Step>(Math.max(0, tracks - 1)).fill(GAP);
  return lengthSum(...Array<Length>(tracks).fill(TRACK_W), { space: gaps });
}

/** One clip cell's least height: a pie and a word, one control. */
const CELL_H: Length = { control: 1 };
/** One song header's least height: the chevron, index, name and tempo, one control. */
const SONG_H: Length = { control: 1 };
/** The stop row: one control. */
const STOP_H: Length = { control: 1 };

const EIGHT = columnsWidth(8);

function cellsHeight(cells: number): Length {
  return lengthSum(...Array<Length>(cells).fill(CELL_H), { space: Array<Step>(Math.max(0, cells - 1)).fill(1) });
}

const EIGHT_CELLS = cellsHeight(8);

/**
 * The grid's forms, most room first:
 *
 * - `full`: every song header, the open song's eight columns of eight cells, and the stop row.
 * - `rows`: no song headers; the open song's tracks plus the stop row, for a surface that holds
 *   the set elsewhere (a tab strip, a song index).
 */
export const LOOP_GRID_FORMS: Forms<LoopGridForm> = [
  {
    id: 'full',
    min: { w: EIGHT, h: lengthSum(SONG_H, EIGHT_CELLS, STOP_H, { space: [2, 2] }) },
    ideal: { w: lengthMax(EIGHT, { control: 32 }), h: lengthSum(SONG_H, EIGHT_CELLS, STOP_H, { space: [2, 2] }) },
    grow: { w: true, h: true },
  },
  {
    id: 'rows',
    min: { w: EIGHT, h: lengthSum(EIGHT_CELLS, STOP_H, { space: [2] }) },
    ideal: { w: lengthMax(EIGHT, { control: 32 }), h: lengthSum(EIGHT_CELLS, STOP_H, { space: [2] }) },
    grow: { w: true, h: true },
  },
];
