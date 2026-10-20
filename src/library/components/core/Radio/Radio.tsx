import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../music/viewState';
import type { CheckProps } from '../Checkbox/Checkbox';
import { radioHandlers, radioView } from './Radio.model';
import '../../../primitives/Text.css';
import '../Toggle/size.css';
import '../Checkbox/Checkbox.css';
import './Radio.css';

// The tree and the handlers are framework-free, in the model; this file and `Radio.svelte` only
// hand it to their `Tree`, with the uncontrolled radio's own mixed state as view state.
export type RadioProps = CheckProps;

/**
 * A radio button: one choice of several.
 *
 * **Job.** Pick exactly one of a few options shown side by side (Fill, Fit, Stretch).
 *
 * **Behaviour.** A real `<input type="radio">`, so radios sharing a `name` keep one checked and
 * the arrow keys move the choice along the group, natively. Controlled with `checked` or its own
 * from `defaultChecked`; `onChange` hears `true` when it is picked. HTML's radios have no mixed
 * state, so mixed is drawn only (a dash, `data-mixed`) until the radio is picked: the input reads
 * as not checked.
 *
 * **Parts** (`data-part`): `root` (the label), `box`, `input`, `face` (Checkbox's `well` face,
 * round), `dot` and `dash` (in `--selected-text`), `label`.
 */
export function Radio({ children, ...props }: RadioProps) {
  // Its own mixed state (uncontrolled): from `defaultChecked`, ended by the first pick.
  const [ownMixed] = useState(() => viewState(props.defaultChecked === 'mixed'));
  const mixed = useSyncExternalStore(ownMixed.subscribe, ownMixed.get);
  return <Tree tree={radioView(props, { label: children !== undefined }, mixed)} slots={{ children }} handlers={radioHandlers(props, ownMixed.set)} />;
}

export default Radio;
