import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { PIANO_ROLL_FORMS } from './PianoRoll.forms';
import { pianoRollHandlers, pianoRollView, type PianoRollModelProps } from './PianoRoll.model';
import './PianoRoll.css';

// The props and the tree are framework-free, in the model; `PianoRoll.svelte` draws the same tree.
export { PIANO_ROLL_FORMS, type PianoRollForm } from './PianoRoll.forms';
export type { PianoRollKey, PianoRollModelProps, PianoRollNote } from './PianoRoll.model';

/** PianoRoll's props: all of them data, so the same as the model's. */
export type PianoRollProps = PianoRollModelProps;

/**
 * **Job.** A compact keyboard and note timeline: aligned rows, bar/beat ruling, note blocks and
 * a playhead. widgets' PianoRoll is the behaviour reference (the reusable geometry, no Live, no
 * clips); colours arrive as hue slots and the playhead as a fraction, since the host owns the
 * engine.
 *
 * **Kept.** The roll holds no state and names no handlers: it is read, not played.
 *
 * **Forms** (`PIANO_ROLL_FORMS`; read with `useForm`): `full` (labelled keys, bar numbers) →
 * `compact` (grid and notes alone).
 *
 * **Built from.** Plain marks: keys, lanes, ruling lines, note blocks, the playhead.
 *
 * **Tuning knobs.**
 * - `--yh-roll-rows`: how many rows the grid holds (set inline from the keys).
 * - `--yh-roll-ink`: a note's fill (a hue slot's `--hue-N`, else `--text-2`).
 */
export function PianoRoll(props: PianoRollProps) {
  const form = useForm(PIANO_ROLL_FORMS);
  return <Tree tree={pianoRollView(props, form)} handlers={pianoRollHandlers()} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
PianoRoll.forms = PIANO_ROLL_FORMS;

export default PianoRoll;
