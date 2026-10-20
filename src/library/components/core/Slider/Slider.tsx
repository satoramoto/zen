import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { sliderHandlers, sliderView, type SliderEntry, type SliderModelProps } from './Slider.model';
// The caption, labels and readout are Texts, the track and thumb Surfaces, drawn with their classes.
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './Slider.css';

// The props, the tree and the handlers are framework-free, in the model; the gesture is the
// `paramGesture` store (`../Param/paramGesture.ts`) and the typed readout the `sliderEntry` store
// (`sliderEntry.ts`), reporting its text to this view state; `Slider.svelte` draws the same tree.
export type { SliderLayout, SliderSide, SliderTyping } from './Slider.model';

/** `live.slider`: the knob's gesture, laid out straight. Mirrors `@openflow/widgets` Slider. */
export type SliderProps = SliderModelProps;

/**
 * **Job.** Set a parameter by its position on a straight track: a fader whose length is what it is
 * saying, or a row whose reading sits inside it.
 *
 * **Behaviour.** Controlled through `onChange` (and `onRelease` when a gesture ends). A drag along
 * the track grabs the value where it is, geared to the drawn length (⌘/Ctrl held for fine); ← → ↑ ↓
 * step, Page Up / Down ten steps, Home / End the ends; double-click (not after a drag) resets to the
 * default; Escape abandons a drag. `keyStep` supplies the keys' own next values first; a drag
 * within `snap` of one of `detents` lands on it. With `onDepth`, shift-drag sets `depth` and shift-double-click
 * clears it. `role="slider"` with the orientation, named by `label`, else the caption. With
 * `typed`, the readout is a button ("{label} {reading}, type a value") that opens a field in its
 * place: Enter sets the parsed value, Escape cancels (and goes no further, so a sheet around it
 * stays open), leaving the field sets it; focus returns to the readout.
 *
 * **Parts** (`data-part`). `caption`; `track` the channel, a `well`, carrying the gesture; `fill` the
 * value from `origin`, lit (`--lit`, `--mat-lit-glow`); `span` and `reach` the depth range and its
 * far end; `live` where a driver has it; `detent` a tick at each of `detents` (`data-default` on the
 * one at the default), in line with the thumb's centre; `thumb` (absent while `mixed`) the cap, a `handle` (a thin lit mark when `inside`, a round-ended knob
 * standing proud of a thin groove in a `row`, where the track is the knob's height and the groove
 * is drawn inside it);
 * `readout` the reading, in the readout face with tabular figures (a button with `typed`); `entry`
 * the field that replaces it while typing; `labels` the row of `detent-label`s under the track
 * (`data-default` on the default's); `driver` (inside `caption`, with
 * `driver` set) who is moving it, `← {driver}` in the fill ink (`--lib-slider-ink`).
 */
export function Slider(props: SliderProps) {
  const [entry] = useState(() => viewState<SliderEntry>(null));
  const text = useSyncExternalStore(entry.subscribe, entry.get);
  return <Tree tree={sliderView(props, text)} handlers={sliderHandlers(props, entry.set)} />;
}
