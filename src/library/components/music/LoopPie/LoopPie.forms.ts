// LoopPie's forms (docs/assembly.md): the loop-phase ring, in scale units. One form: a square
// the size of a control height at its least, two at its ideal. The region's plate is the solver's.
import type { Forms } from '../../../layout/assembly/types';

export type LoopPieForm = 'pie';

/** The loop pie's one form: square, `1 control` least, `2 controls` ideal, growing both ways. */
export const LOOP_PIE_FORMS: Forms<LoopPieForm> = [
  {
    id: 'pie',
    min: { w: { control: 1 }, h: { control: 1 } },
    ideal: { w: { control: 2 }, h: { control: 2 } },
    grow: { w: true, h: true },
    ratio: { w: 1, h: 1 },
  },
];
