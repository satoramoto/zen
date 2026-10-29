import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { LOOP_PIE_FORMS } from './LoopPie.forms';
import { loopPieHandlers, loopPieView, type LoopPieModelProps } from './LoopPie.model';
// The middle reading is Text, through its class. Before LoopPie.css, so the pie's own face wins.
import '../../../primitives/Text.css';
import './LoopPie.css';

// The props and the tree are framework-free, in the model; `LoopPie.svelte` draws the same tree.
export { LOOP_PIE_FORMS, type LoopPieForm } from './LoopPie.forms';
export { clampPhase, loopWedge, type LoopPieModelProps } from './LoopPie.model';

/** LoopPie's props: all of them data, so the same as the model's. */
export type LoopPieProps = LoopPieModelProps;

/**
 * **Job.** One loop's phase as a wedge swept clockwise from twelve o'clock: at a glance how far
 * through the loop this track is, and while recording how many bars it has captured. Set's
 * TrackStatus pie is the behaviour reference; the bar-count middle reading is this widget's own.
 *
 * **Changed.** *Hierarchy*: the wedge is the reading, the middle numeral only the recording
 * length (or the label the app gives it); when there is nothing to read there is no middle text.
 * *State changes structure, not circus*: `recording` swaps the middle to the bar count and marks
 * `data-recording`; a full turn is a disc, since a closed arc draws as a standstill.
 *
 * **Kept.** The phase is 0–1, clamped; colour is a hue slot (`HueSlot`), never a meaning.
 *
 * **Forms** (`LOOP_PIE_FORMS`; read with `useForm`): `pie`, a square one control at its least and
 * two at its ideal, keeping 1:1 through `ratio`.
 *
 * **Built from.** An SVG ring and wedge plus a `numeral` Text middle; the accessible name is the
 * percentage (or the recording length).
 *
 * **Tuning knobs.**
 * - `--yh-loop-size`: the pie's box (default `var(--control-h)`; the form's ideal grows it).
 * - `--yh-loop-track`: the ring's stroke.
 * - `--yh-loop-ink`: the wedge's fill (a hue slot's `--hue-N`, else `--text-2`).
 * - `--yh-loop-width`: the ring's hairline.
 */
export function LoopPie(props: LoopPieProps) {
  const form = useForm(LOOP_PIE_FORMS);
  return <Tree tree={loopPieView(props, form)} handlers={loopPieHandlers()} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
LoopPie.forms = LOOP_PIE_FORMS;

export default LoopPie;
