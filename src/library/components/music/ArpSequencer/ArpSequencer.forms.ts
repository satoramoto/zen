// ArpSequencer's forms (docs/assembly.md): what the arp needs, in scale units, never measured.
// Each number is a rule ArpSequencer.css lays out with; change one, change both.
import { lengthMax, lengthSum, type Forms, type Length } from '../../../layout/assembly';
import type { Step } from '../../../primitives/step';

/** The two ways the arp is drawn, most room first. */
export type ArpSequencerForm = 'full' | 'compact';

/** Sixteen step columns and eight degree rows, the grid's shape in both forms. */
const COLUMNS = 16;
const ROWS = 8;

/** The gap between cells, a step (a tie bar crosses it). */
const GAP: Step = 1;

/** One cell's least side: three quarters of a control height (a little less in compact). */
const CELL: Length = { control: 0.75 };
const CELL_COMPACT: Length = { control: 0.6 };

/** The grid's width: sixteen cells and the gaps between them, plus the degree labels when full. */
function gridWidth(cell: Length, labels: boolean): Length {
  const label: Length = lengthSum({ chars: { caption: 3 } }, { space: 1 });
  return lengthSum(...Array<Length>(COLUMNS).fill(cell), { space: Array<Step>(COLUMNS - 1).fill(GAP) }, labels ? label : 0);
}

/** The grid's height: eight rows and the gaps between them. */
function gridHeight(cell: Length): Length {
  return lengthSum(...Array<Length>(ROWS).fill(cell), { space: Array<Step>(ROWS - 1).fill(GAP) });
}

/** The full head: the followed chord's line, then the degree legend's (up to two caption lines). */
const HEAD_FULL: Length = lengthSum({ lines: { heading: 1 } }, { space: 1 }, { lines: { caption: 2 } });

/** The compact head: the followed chord's line only. */
const HEAD_COMPACT: Length = { lines: { heading: 1 } };

/** One knob: its padding either side, the name's two caption lines, a gap, the 2.25 control ring. */
const KNOB: Length = lengthSum({ space: [2, 2] }, { lines: { caption: 2.6 } }, { space: 1 }, { control: 2.25 });

/** The foot: the four knobs' height, the mode beside them (no taller). */
const FOOT: Length = KNOB;

/** The knobs' least width: four knobs and their three gaps. */
const KNOB_W: Length = lengthSum({ control: 2.25 }, { space: [2, 2] });
const KNOBS_W: Length = lengthSum(...Array<Length>(4).fill(KNOB_W), { space: [3, 3, 3] });

/**
 * The arpeggiator's forms, most room first:
 *
 * - `full`: the chord it follows, what every degree sounds as, the degree labels beside the grid,
 *   the mode and the four knobs. Least: sixteen cells, eight rows, the legend.
 * - `compact`: no degree labels and no degree readout; the same 16 × 8 grid, mode and knobs.
 *
 * Both take spare width (the cells share it), so the arp fills its region.
 */
export const ARP_SEQUENCER_FORMS: Forms<ArpSequencerForm> = [
  {
    id: 'full',
    min: {
      w: lengthMax(gridWidth(CELL, true), KNOBS_W, { control: 14 }),
      h: lengthSum(HEAD_FULL, { space: 2 }, gridHeight(CELL), { space: 2 }, FOOT),
    },
    ideal: {
      w: lengthMax(gridWidth(CELL, true), KNOBS_W, { control: 24 }),
      h: lengthSum(HEAD_FULL, { space: 2 }, gridHeight(CELL), { space: 2 }, FOOT),
    },
    grow: { w: true },
  },
  {
    id: 'compact',
    min: {
      w: lengthMax(gridWidth(CELL_COMPACT, false), KNOBS_W, { control: 12 }),
      h: lengthSum(HEAD_COMPACT, { space: 2 }, gridHeight(CELL_COMPACT), { space: 2 }, FOOT),
    },
    ideal: {
      w: lengthMax(gridWidth(CELL_COMPACT, false), KNOBS_W, { control: 20 }),
      h: lengthSum(HEAD_COMPACT, { space: 2 }, gridHeight(CELL_COMPACT), { space: 2 }, FOOT),
    },
    grow: { w: true },
  },
];
