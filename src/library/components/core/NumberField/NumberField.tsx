import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { numberFieldHandlers, numberFieldView, type NumberFieldModelProps } from './NumberField.model';
import '../../../primitives/Text.css';
import './NumberField.css';

// The props, the tree and the behaviour are framework-free, in the model and its
// `numberFieldInput.ts` stores; this file and `NumberField.svelte` only hand the model's tree to
// their `Tree`, keeping the text being typed as view state.
export type { FillOrigin } from './NumberField.model';

/** `live.numbox`: drag it like a fader, or type into it. Mirrors `@openflow/widgets` NumberField. */
export type NumberFieldProps = NumberFieldModelProps;

/**
 * **Job.** A parameter's value as a number you can read exactly and change in place: the value box
 * of a device panel, where a knob would be too coarse and a field too slow.
 *
 * **Behaviour.** Controlled through `onChange` (and `onRelease` when a gesture ends). A horizontal
 * drag grabs the value where it is (no jump to the click), ⌘/Ctrl held for fine; ← → ↑ ↓ step,
 * Page Up / Down ten steps, Home / End the ends; a double-click (that wasn't a drag) resets to the
 * parameter's default; Escape abandons a drag in hand. When `editable` (and not an enum), a digit,
 * sign, point or Enter opens a text editor: Enter or blur commits (clamped and quantized), Escape
 * cancels. The box reserves its longest reading so it never resizes as it counts. `role="slider"`
 * named by `label`, else the caption.
 *
 * **Type.** The caption is a `caption` `Text` in the label case; the body and the input are
 * `numeral` `Text`s at the label size, untracked.
 *
 * **Parts** (`data-part`). `caption` the name; `body` the value window, a `screen`; `fill` the
 * value as a lit bar from `origin` (`--lit`, `--mat-lit-glow`); `text` the reading, in the readout
 * face with tabular figures; `ink` the same reading in `--on-hue`, clipped to the fill so the digits
 * stay legible over it; `input` the editor that replaces `body` while typing.
 */
export function NumberField(props: NumberFieldProps) {
  // The text being typed (`null` when not editing): view state the editor store sets through `edit`.
  const [draft] = useState(() => viewState<string | null>(null));
  const typed = useSyncExternalStore(draft.subscribe, draft.get);
  return <Tree tree={numberFieldView(props, typed)} handlers={numberFieldHandlers(props, draft.set)} />;
}
