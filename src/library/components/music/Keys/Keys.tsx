import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { keysHandlers, keysView, type KeysModelProps } from './Keys.model';
import '../../../primitives/Text.css';
import './Keys.css';

// The props and the tree are framework-free, in the model; `Keys.svelte` draws the same tree.
export type { TipAction, KeysModelProps } from './Keys.model';

/** Keys takes no children: its props are the model's. */
export type KeysProps = KeysModelProps;

/**
 * The keyboard strip: the keyboard's range, where the split sits, and what each zone (left and
 * right of the split; in Yahaha, the parts) is holding.
 *
 * **Job.** At a glance a player needs three things: which zone owns which keys, where the split
 * is (as a note name, not a guess from position), and which keys are sounding. With `onSplit` it
 * is also where the split is set: drag the split flag, step it with the arrows (PageUp/PageDown an
 * octave, Home/End the limits), or click it (Enter) to arm a pick and press the key that should
 * become the split. Esc disarms.
 *
 * **Changed.** *Hierarchy:* a zone ruler above the keys names each zone (`leftName`, `rightName`:
 * "Left", "Right 1") and what it holds ("G A C E", "E4 A4"), so the picture's accessible label is also what a sighted
 * player reads; before, held notes were only colour on keys. The ruler is the line a player
 * wants mid-song, so it is a full `--control-h` tall and readable from a metre: what is held at
 * `--size-body` in the strong weight, the zone's name at `--size-label` in `--text-2`. Held keys
 * no longer carry their own small name: it said again, at caption size, what the ruler says.
 * *Colour meaning:* each zone's lamp is its underline on the ruler, in the zone's hue slot
 * (`leftHue`, `rightHue`), lit with `--bloom` while the zone sounds, so the zone's name, its
 * colour and its keys line up; as a 3px
 * strip on the keys' top edge it was cut by every sharp and read as the frame. *Affordance:* the split is a labelled
 * flag reading the split note ("F#2") with a grip, sitting on the split line, instead of a 6px
 * grip lost in the keys; locked it turns dashed and loses its grip, armed it rings in `--accent`
 * with a "press a key" hint, so each state looks like what it does (craft-details.md, focus and
 * keyboard handlers). *Contrast:* the keys are drawn as keys, light faces and dark sharps in either
 * scheme, in a real keyboard's proportions, rather than near-black on black (color.md, light and
 * dark themes); the faces are the contract's `--key-white` and `--key-black`, and the gaps,
 * sharp edges and C names are mixed between them, not derived from the ground; the C names sit at
 * a 45% mix so they read on the faces. The split line is one ink with the flag's foot,
 * `--text-1`, with a 1px halo in whichever key face lies farthest from it, so it can't be taken
 * for a key gap below the sharps in any scheme. Hue slots (`--hue-N`) appear only for zone
 * identity, in the zone underlines and the held keys; the left-zone tint is gone because the
 * underline and ruler already say who owns the range (color.md 60/30/10, anti-ai-slop.md token
 * role drift). *Numerals:* note names are set in `--font-readout` with tabular figures.
 *
 * **Width.** A fixed `width` in px, or `width="fill"`: the strip takes its container's width
 * (`width: 100%`), measures itself before paint and on every resize (a `ResizeObserver`), and lays
 * the keys out from that, so a caller no longer measures for it. Until it has a width (a hidden
 * container, or no layout yet) it keeps its height and hides its contents rather than drawing
 * keys at 0 px.
 *
 * **Kept.** MIDI numbers with C3 = 60 and a name on every C; the split line that steps round a
 * black key the way the keys' own edges do; held right notes drawing over held left ones; the
 * controlled model (the strip only asks through `onSplit`/`onPick`); the slider semantics,
 * keyboard steps, drag slop, Esc caught before the app's, and the accessible names.
 *
 * **Built from.** No `Surface`, `Text` or `focusRing` yet: the key faces are the contract's
 * `--key-white` / `--key-black`, not the `key` material, so a Surface would change them; the
 * ruler's type mixes weights the text roles don't pair (a label at body weight, readout figures
 * at label size); and focus lands on the handle while its ring is drawn on the flag inside it.
 * The strip is `keysView` (Keys.model.ts, the tree both renderers draw); the pointer and keyboard
 * input is the `keysInput.ts` store and the measured width the `fillWidth.ts` store, bound on the
 * root, the width kept as this binding's view state (`viewState.ts`).
 *
 * **Tuning knobs.**
 * - `--yh-keys-black-w`, `--yh-keys-split-x`, `--yh-keys-split-step`: the layout's geometry (a
 *   sharp's width, the split's x and its step round a sharp), set inline from the key layout.
 * - `--yh-keys-ruler-h`, `--yh-keys-strip-h`, `--yh-keys-black-h`, `--yh-keys-flag-w`: the ruler's
 *   and strip's heights, a sharp's length, the split flag's width; all from `--control-h`.
 * - `--yh-keys-line`, `--yh-keys-key-radius`: the split line's weight, a key's lower corners.
 * - `--yh-keys-white`, `--yh-keys-black`, `--yh-keys-gap`, `--yh-keys-sharp-edge`,
 *   `--yh-keys-label`: the key faces and the steps between them (gaps, a sharp's edge, C names).
 * - `--yh-keys-split-ink`, `--yh-keys-split-halo`: the split line's ink and the halo that keeps it
 *   off the faces.
 * - `--yh-keys-hue`: a zone's hue slot, for its lamp and held keys.
 */
export function Keys(props: KeysProps) {
  // The measured width (`width="fill"`): view state the `fillWidth` store sets through `width`.
  const [width] = useState(() => viewState(0));
  const measured = useSyncExternalStore(width.subscribe, width.get);
  return <Tree tree={keysView(props, measured)} handlers={keysHandlers(props, width.set)} />;
}

export default Keys;
