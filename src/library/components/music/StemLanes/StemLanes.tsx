import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { STEM_LANES_FORMS } from './StemLanes.forms';
import { stemLanesHandlers, stemLanesView, type StemLanesModelProps } from './StemLanes.model';
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './StemLanes.css';

// The props and the tree are framework-free, in the model; this file and `StemLanes.svelte` only
// hand its tree to their `Tree`, with the form the assembled screen chose.
export { STEM_LANES_FORMS, STEM_LANES_FORM_IDS, STEM_LANES_SIZE } from './StemLanes.forms';
export type { StemLanesForm, StemLanesSize } from './StemLanes.forms';
export type { StemLanesModelProps } from './StemLanes.model';

export type StemLanesProps = StemLanesModelProps;

/**
 * **Job.** One deck's faceplate, for a solo looping performer: where the loop window sits in the
 * file, where each hot cue is, where playback is, and one lane per stem so the shape of each
 * part can be read at a glance and muted or soloed from the same row. Every lane shares one time
 * axis with the ruler above it.
 *
 * **Changed.** *One axis*: the ruler and the lanes are drawn in the same four-column grid (mark,
 * name, envelope, keys), so a cue's time and the playhead line up with the peaks under them; the
 * ruler is not a separate strip with its own width. *Shape over summary*: each lane's peaks are one
 * closed, mirrored envelope path, not a column of bars, so a quiet passage and a loud one differ in
 * area as well as height; the path keeps a centre line, so silence still reads as a lane and not a
 * gap. *Colour meaning*: a lane's hue slot is identity, on the mark and on the envelope, and nothing
 * else is coloured: the window band, the playhead, the cue flags and the M / S pair are neutral, so
 * a muted lane recedes (mark and envelope dim) without borrowing an alarm colour. *Density*: the
 * same deck is `four` (every lane, labelled cue flags), `stacked` (every lane, thinner, cue flags as
 * bare markers) or `one` (the selected lane alone, taller, the ruler kept); the heights, name column
 * and keys column are scale steps, in `StemLanes.forms.ts`.
 *
 * **Kept.** Fully controlled: a cue flag calls `onCue(id)`, and each lane's M and S lamps call
 * `onToggle(id)` (the app decides what it toggled, and passes back the `muted` / `soloed` flags it
 * holds). No state is drawn that the props don't carry. Without `onToggle` the lamps are disabled;
 * without `onCue` the cue flags are; without a `position` or a `window`, neither is drawn.
 *
 * **Forms** (`StemLanes.forms.ts`): `four` → `stacked` → `one`, read with `useForm` and carried as
 * `data-form`. Each declares the deck's own needs in scale units, and the lengths it was counted
 * from are the ones the CSS sets.
 *
 * **Tuning knobs.**
 * - `--yh-stem-*`: the form's lengths (`-ruler-h`, `-lane-h`, `-mark-w`, `-name-w`, `-keys-w`,
 *   `-pad`, `-gap`, set inline by the model), the envelope's ink weight and washes (`-line`,
 *   `-fill-opacity`, `-stroke-opacity`), the muted lane's fade (`-muted-opacity`), the loop band's
 *   wash (`-band-opacity`), and the 0–1 positions the model sets inline (`-at`, `-start`, `-end`,
 *   `-position`).
 *
 * The tree, the envelope path and the handlers live in `StemLanes.model.ts`; this hands its tree to
 * `Tree`, as `StemLanes.svelte` does.
 */
export function StemLanes(props: StemLanesProps) {
  const form = useForm(STEM_LANES_FORMS);
  return <Tree tree={stemLanesView(props, form)} handlers={stemLanesHandlers(props)} />;
}
