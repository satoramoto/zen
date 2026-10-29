// MacroPads' forms (docs/assembly.md): two pads across (`two-up`, the mockups' pair) or one wide
// pad (`one-up`), in scale units. Each pad is the XY pad's own form (`square` in `two-up`, `wide`
// in `one-up`) with one caption line over it, so the two lists stay together: if an XY pad's least
// changes, the bank's does too.
import { needsAcross, lengthSum } from '../../../layout/assembly/units';
import type { Forms, Length, Need } from '../../../layout/assembly/types';
import type { Step } from '../../../primitives/step';
import { XY_PAD_FORMS } from '../XYPad/XYPad.forms';

/** One bank, two pads across or one wide pad. */
export type MacroPadsForm = 'two-up' | 'one-up';

/** The space between pads across and down: `--space-2`, the step MacroPads.css uses. */
export const MACRO_PAD_GAP: Step = 2;
/** The space between a pad's caption and its field: `--space-1`. */
export const MACRO_LABEL_GAP: Step = 1;

/** One caption line over the pad, and the step under it. */
const LABEL_H: Length = lengthSum({ lines: { caption: 1 } }, { space: MACRO_LABEL_GAP });

/** A pad with its caption above it. */
const labelled = (pad: Need): Need => ({ w: pad.w, h: lengthSum(LABEL_H, pad.h) });

const square = XY_PAD_FORMS[0];
const wide = XY_PAD_FORMS[1];

/**
 * The forms, most room first. `two-up` is the pair the mockups show (two square-ish fields, one
 * caption each); `one-up` is one wide field, for a macro that deserves the whole strip. Both grow
 * across; the height follows the width past the captions, so two pads stay square and one stays
 * 2:1.
 */
export const MACRO_PADS_FORMS: Forms<MacroPadsForm> = [
  {
    id: 'two-up',
    min: needsAcross(MACRO_PAD_GAP, labelled(square.min), labelled(square.min)),
    ideal: needsAcross(MACRO_PAD_GAP, labelled(square.ideal), labelled(square.ideal)),
    grow: { w: true },
    ratio: { w: 2, h: 1, fixed: { w: { space: MACRO_PAD_GAP }, h: LABEL_H } },
  },
  {
    id: 'one-up',
    min: labelled(wide.min),
    ideal: labelled(wide.ideal),
    grow: { w: true },
    ratio: { w: 2, h: 1, fixed: { w: 0, h: LABEL_H } },
  },
];
