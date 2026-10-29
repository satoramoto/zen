// TransitionRow's forms (docs/assembly.md): what the six transition pads need, in scale units,
// never measured. Each length below is a rule in TransitionRow.css, the two kept together: a pad is
// two control heights tall and at least a target wide, its label one line with a `--space-2` inset,
// and the row is six pads across (the grid, two rows of three).
import { lengthMax, lengthSum, type Forms, type Length } from '../../../layout/assembly';
import type { Step } from '../../../primitives/step';

export type TransitionRowForm = 'row' | 'grid';

/** The surface's pads, in the order the mockups draw them; the fixtures take their labels from here. */
export const TRANSITION_LABELS = ['RISER', 'DROP', 'CRASH', 'HOLD A', 'HOLD B', 'CUT'] as const;

/** The gap between pads and between the grid's rows. */
const GAP: Step = 2;

/**
 * Label case is upper case in some faces, wider than the 0.6 em average, so each word counts one
 * character more (the same slack FaderBank's keys take).
 */
const SLACK = 1;

/** The label's line at the label role. */
const label = (word: string): Length => ({ chars: { label: word.length + SLACK } });

/** One pad: its label, a `--space-2` inset each side and the 1 px border a side, never under a target. */
const padWidth = (word: string): Length => lengthMax({ target: 1 }, lengthSum(label(word), { space: [2, 2] }, { px: 2 }));

/** One pad's least height: two control heights (the biggest target on the surface), or its two lines and inset, whichever is more. */
const PAD_H: Length = lengthMax({ control: 2 }, lengthSum({ lines: { label: 1, caption: 1 } }, { space: [2, 2] }));

/** `row`: all six pads in one line, so the sum of their widths and the five gaps between them. */
const ROW_W = lengthSum(...TRANSITION_LABELS.map(padWidth), { space: [GAP, GAP, GAP, GAP, GAP] });

/**
 * `grid`: two rows of three, so each column is as wide as its widest pad: (RISER, HOLD A),
 * (DROP, HOLD B), (CRASH, CUT), and the three pads across plus two gaps.
 */
const COLUMNS: readonly (readonly string[])[] = [
  ['RISER', 'HOLD A'],
  ['DROP', 'HOLD B'],
  ['CRASH', 'CUT'],
];
const GRID_W = lengthSum(...COLUMNS.map((words) => lengthMax(...words.map(padWidth))), { space: [GAP, GAP] });

/** Two rows of three: the pads' least height twice and the row gap. */
const GRID_H = lengthSum(PAD_H, PAD_H, { space: [GAP] });

/**
 * The transition row's forms, most room first:
 *
 * - `row`: the six pads in one line (the mockups' `RISER / DROP / CRASH / HOLD A / HOLD B / CUT`),
 *   each growing to share the width. Least: the six labels' widths at the widest pad size and the
 *   gaps; ideal: four control widths of spare room, the pads taller than their least.
 * - `grid`: two rows of three, for a surface too narrow for one line. Least: the three widest
 *   columns and the gaps, two pads' least height and the row gap; it grows both ways.
 */
export const TRANSITION_ROW_FORMS: Forms<TransitionRowForm> = [
  {
    id: 'row',
    min: { w: ROW_W, h: PAD_H },
    ideal: { w: lengthSum(ROW_W, { control: 4 }), h: lengthMax(PAD_H, { control: 3 }) },
    grow: { w: true },
  },
  {
    id: 'grid',
    min: { w: GRID_W, h: GRID_H },
    ideal: { w: lengthSum(GRID_W, { control: 6 }), h: lengthSum(lengthMax(PAD_H, { control: 3 }), lengthMax(PAD_H, { control: 3 }), { space: [GAP] }) },
    grow: { w: true, h: true },
  },
];
