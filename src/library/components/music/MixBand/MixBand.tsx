import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { MIX_BAND_FORMS } from './MixBand.forms';
import { mixBandHandlers, mixBandView, type MixBandModelProps } from './MixBand.model';
// Heads are Texts and wells Surfaces, through their classes. Before MixBand.css.
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
// The strips wrap Fader, Meter, LampButton and the SendBars subtree's own styles.
import '../../music/Fader/Fader.css';
import '../../music/Meter/Meter.css';
import '../../core/LampButton/LampButton.css';
import '../SendBars/SendBars.css';
import './MixBand.css';

// The props and the tree are framework-free, in the model; `MixBand.svelte` draws the same tree.
export { MIX_BAND_FORMS, type MixBandForm } from './MixBand.forms';
export type { MixBandModelProps } from './MixBand.model';

/** MixBand's props: all of them data or callbacks, so the same as the model's. */
export type MixBandProps = MixBandModelProps;

/**
 * **Job.** The mix as a column-aligned band: one strip per track (name, meter, fader, two sends,
 * M / S / Arm), then the effect returns (meter, fader, name). At a glance every level, every
 * send and every lamp, each under its track. Yahaha's FaderBank and SendList are the behaviour
 * references (strips, send layers, lamp rows, `tall → short` proportions).
 *
 * **Changed.** *Hierarchy*: the fader's travel is the level; the sends sit under it and the
 * lamps under those, so a strip reads top to bottom as level → feeds → state. Returns keep
 * meter, fader and name and nothing else — no sends, no lamps.
 *
 * **Kept.** The band holds no state: a fader asks for `onLevel(id, 0–1)`, a bar for
 * `onSend(id, which, 0–1)`, a lamp for its toggle; parked strips draw faint but keep alignment.
 *
 * **Forms** (`MIX_BAND_FORMS`; read with `useForm`): `tall` keeps the travel, `short` keeps
 * every concept with the travel FaderBank's `short` allows.
 *
 * **Built from.** `Meter`, `Fader` and `LampButton` by name (never re-drawn), the SendBars
 * subtree inline, Texts for heads. `Fader`'s 0–127 levels are converted at the boundary, so the
 * band speaks 0–1 throughout.
 *
 * **Tuning knobs.**
 * - `--yh-mixband-gap`: between strips.
 * - `--yh-mixband-strip-gap`: between a strip's rows.
 */
export function MixBand(props: MixBandProps) {
  const form = useForm(MIX_BAND_FORMS);
  return <Tree tree={mixBandView(props, form)} handlers={mixBandHandlers(props)} />;
}

/** The forms, for a region to add up (`docs/assembly.md`). */
MixBand.forms = MIX_BAND_FORMS;

export default MixBand;
