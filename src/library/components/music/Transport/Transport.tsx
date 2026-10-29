import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { TRANSPORT_FORMS } from './Transport.forms';
import { transportHandlers, transportView, type TransportModelProps } from './Transport.model';
// The tempo is Text, through its class. Before Transport.css.
import '../../../primitives/Text.css';
import './Transport.css';

// The props and the tree are framework-free, in the model; `Transport.svelte` draws the same tree.
export { TRANSPORT_UNITS, clockText, positionText, readingText, type TransportLoop, type TransportPosition, type TransportTempo, type TransportUnit } from './Transport.model';
export { TRANSPORT_FORMS, type TransportForm } from './Transport.forms';
export type { TransportModelProps } from './Transport.model';

/** Transport's props: all of them data or callbacks, so the same as the model's. */
export type TransportProps = TransportModelProps;

/**
 * **Job.** Playback, the tempo it runs at and where the head is: play, stop, loop, tempo and a
 * position reading in one row. mix[flow]'s Transport is the behaviour reference (the header row
 * it grew); the tempo is a plain number here, not a Param, and the reading's unit is controlled.
 *
 * **Changed.** *Hierarchy*: words, not icons — Play/Pause/Stop read at stage distance where a
 * 14 px glyph doesn't. The reading is a button that toggles beats/seconds.
 *
 * **Kept.** No audio in here: the host owns the engine and hands this the facts; everything past
 * play and stop is optional, so a bare grid gets two buttons and a clock.
 *
 * **Forms** (`TRANSPORT_FORMS`; read with `useForm`): `bar` (the whole row) → `compact`
 * (play and the reading, for a strip holding tempo elsewhere).
 *
 * **Built from.** `Button` (play, stop, tempo steps, the reading) and `LampButton` (the loop),
 * Texts for the tempo value.
 *
 * **Tuning knobs.**
 * - `--yh-transport-gap`: between the row's members.
 */
export function Transport(props: TransportProps) {
  const form = useForm(TRANSPORT_FORMS);
  return <Tree tree={transportView(props, form)} handlers={transportHandlers(props)} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
Transport.forms = TRANSPORT_FORMS;

export default Transport;
