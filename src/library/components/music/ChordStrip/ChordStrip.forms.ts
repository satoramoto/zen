// ChordStrip's forms (docs/assembly.md): what the progression strip needs, in scale units, never
// measured. Each number below is the rule ChordStrip.css lays out with; change one, change both.
import { lengthMax, lengthSum, type Forms, type Length } from '../../../layout/assembly';
import type { Step } from '../../../primitives/step';

/** The two ways the strip is drawn, most room first. */
export type ChordStripForm = 'full' | 'compact';

/** Eight blocks is a song's progression on one line; a ninth narrows every block rather than wrap. */
const BLOCKS = 8;

/** Between blocks (a full step in `full`, a tight one in `compact`). */
const GAP: Step = 2;

/** One block's least width: a four-character chord name ("Am7", "Cmaj7") and its padding. */
const NAME_W: Length = lengthSum({ chars: { body: 4 } }, { space: [2, 2] });

/** The eight blocks and the gaps between them; every story keeps all eight. */
const STRIP_W: Length = lengthSum(...Array<Length>(BLOCKS).fill(NAME_W), { space: Array<Step>(BLOCKS - 1).fill(GAP) });

/** A full block: its padding, the chord's name, and the notes line under the active one. */
const FULL_BLOCK: Length = lengthSum({ space: [2, 2] }, { lines: { body: 1 } }, { space: 1 }, { lines: { caption: 1 } });

/** A compact block: a step of padding and the name only. */
const COMPACT_BLOCK: Length = lengthSum({ space: [1, 1] }, { lines: { body: 1 } });

/** The action row (MUTATE / KEEP / REVERT): one control height. */
const ACTIONS: Length = { control: 1 };

/** A full strip: the blocks, a step, the action row. */
const FULL_H: Length = lengthSum(FULL_BLOCK, { space: 2 }, ACTIONS);

/** A compact strip: the shorter blocks, a step, the action row. */
const COMPACT_H: Length = lengthSum(COMPACT_BLOCK, { space: 2 }, ACTIONS);

/**
 * The progression strip's forms, most room first:
 *
 * - `full`: every chord's name, the notes under the active one, and the action row with its
 *   words. Least: eight four-character blocks, a notes line and the actions.
 * - `compact`: names only, the actions as short labels. Same eight blocks; less height.
 *
 * Both take spare width (the blocks share it), so the strip fills its region.
 */
export const CHORD_STRIP_FORMS: Forms<ChordStripForm> = [
  {
    id: 'full',
    min: { w: lengthMax(STRIP_W, { control: 12 }), h: FULL_H },
    ideal: { w: lengthMax(STRIP_W, { control: 18 }), h: FULL_H },
    grow: { w: true },
  },
  {
    id: 'compact',
    min: { w: lengthMax(STRIP_W, { control: 10 }), h: COMPACT_H },
    ideal: { w: lengthMax(STRIP_W, { control: 15 }), h: COMPACT_H },
    grow: { w: true },
  },
];
