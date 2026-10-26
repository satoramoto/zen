import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { namePickerHandlers, namePickerState, namePickerView, type NamePickerModelProps } from './NamePicker.model';
import '../../../primitives/Text.css';
import '../../../primitives/Stack.css';
import '../../../primitives/Surface.css';
import './NamePicker.css';

// The props, the tree and the pick are framework-free, in the model; this file and
// `NamePicker.svelte` only hand its tree to their `Tree`, with the name chosen so far as view state.
export type { NamePickerModelProps } from './NamePicker.model';

export interface NamePickerProps extends NamePickerModelProps {
  /** Above the names, as the page's heading; it names the list. Default none. */
  title?: ReactNode;
  /** Under the title: what picking a name does. Default none. */
  message?: ReactNode;
  /** Anything the app adds under the pick key (a contact line, a link). */
  children?: ReactNode;
}

/**
 * A full-screen step: pick your own name from a list, once.
 *
 * **Job.** Let someone say which of a known set of people they are, before an app shows anything
 * that depends on it.
 *
 * **Behaviour.** The names as Radios in a `radiogroup` named by the title; Tab reaches the chosen
 * one (else the first), the arrows move the choice natively. `value` is the name chosen to start
 * with, and the list follows it when it changes. The pick key (`That's me`, `pickLabel`) is
 * disabled until a name is chosen; it, or Enter on the list, calls `onPick` with the chosen name.
 * A long list scrolls inside the card.
 *
 * **Parts** (`data-part`): `root` (a `ground` Surface filling the screen), `card` (a `raised`
 * Surface), `form`, `title`, `message`, `names` (the radiogroup), `extra` (the `children`).
 *
 * **Tuning knobs**: none.
 */
export function NamePicker({ title, message, children, ...props }: NamePickerProps) {
  const [own] = useState(() => viewState(namePickerState(props.value)));
  const state = useSyncExternalStore(own.subscribe, own.get);
  const slots = { title: title != null, message: message != null, children: children != null };
  return <Tree tree={namePickerView(props, state, slots)} slots={{ title, message, children }} handlers={namePickerHandlers(props, own)} />;
}

export default NamePicker;
