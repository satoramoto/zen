import { Tree } from '../../../view/Tree';
import { stepValueHandlers, stepValueView, type StepValueModelProps } from './StepValue.model';
import '../../../primitives/Text.css';
import './StepValue.css';

// The props, the tree and the behaviour are framework-free, in the model and its `adjust.ts` store;
// this file and `StepValue.svelte` only hand the model's tree to their `Tree`.
export type { StepHue, TipAction } from './StepValue.model';

export type StepValueProps = StepValueModelProps;

/**
 * A value set in place, in a small cell: a part's send, a Master EQ band's gain, a style insert's
 * amount. Press and drag sideways, a wheel notch or an arrow key steps it; Page Up / Down by ten,
 * Home and End to the ends, a double-click back to its default.
 *
 * **Job.** Let a player read one number at a glance, see whose number it is, and nudge it without
 * opening anything. In a column of cells the numbers must line up and the owner must be findable by
 * colour before reading.
 *
 * **Changed.** *Hierarchy and numerals:* the value is now the loudest thing, set in the readout face
 * at numeral weight with tabular figures and a fixed minimum width, right-aligned, so a column of
 * cells reads like a table and digits don't jitter while dragging (typography.md). The tag drops to
 * a label (label case, tracking, secondary ink). *Colour meaning:* the owner's hue moves from the
 * tag's letters to a small swatch beside it, so hue marks identity only and the text keeps full
 * contrast on light palettes; the value is no longer painted in the accent, which is kept for focus
 * and the live drag (color.md: fewer colours, stricter purpose; at most two per component).
 * *Affordance:* a level (`ink="a"`) carries a thin lamp under it showing where it sits in its
 * range, lit in its hue slot with the palette's bloom, so it looks like something with a range
 * that slides; the cell takes a hover fill and an ew-resize cursor, and a drag lights the lamp in
 * the accent. Dim and disabled use the text ladder and an unlit lamp rather than opacity; disabled
 * is the screen's one "shown, not usable" look, a dashed edge with its text in `--text-3`, and a
 * not-allowed cursor. A 2px accent `:focus-visible` ring (craft-details.md). *One hue carrier*
 * (the 2026-10 review): the swatch is an `--space-2` square at the control radius, the same mark
 * as a lamp's LED, rather than a 6px pill, and the range lamp is a 3px line on the cell's bottom
 * edge, so in a column it can't read as the next row's top rule. *Headless* (the view tree): the
 * drag, wheel and keys are the `stepAdjust` store (`adjust.ts`), the tooltip the `tip` store.
 *
 * **Kept.** No bar or box at rest, so it fits a dense cell; every way to set it (drag, wheel, keys,
 * double-click to default) and its slider semantics (aria-valuenow/min/max, valuetext, disabled
 * stays focusable); controlled through `onchange`, sending only real changes, at most one per frame
 * while dragging.
 *
 * **Tuning knobs**
 * - `--yh-stepvalue-fill`: how much of the lamp is lit, 0–1 (where the value sits in its range); set inline by the component.
 */
export function StepValue(props: StepValueProps) {
  return <Tree tree={stepValueView(props)} handlers={stepValueHandlers(props)} />;
}

export default StepValue;
