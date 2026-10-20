import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { CONTROL_SIZES, type ControlSize } from './sizes';
import { switchHandlers, switchView, toggleHandlers, toggleView, type SwitchModelProps, type ToggleModelProps } from './Toggle.model';
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import './size.css';
import './Toggle.css';

// The props and the trees are framework-free, in the model; this file, `Toggle.svelte` and
// `Switch.svelte` only hand the model's tree to their `Tree`.
export { CONTROL_SIZES, type ControlSize };
export type { ToggleModelProps, SwitchModelProps } from './Toggle.model';

export interface ToggleProps extends ToggleModelProps {
  /** The face (stacked) or the reading (inside). */
  children?: ReactNode;
}

/**
 * A latching key: on until pressed again (`aria-pressed`), or, `momentary`, on only while held.
 *
 * **Job.** Turn one thing on or off where it's played from: a mode on a panel of keys (stacked),
 * or a setting on a line of rows (inside), its state read at the row's end.
 *
 * **Behaviour.** Controlled: a press asks through `onChange(!on)` and the key moves when `on`
 * does. Momentary asks for `true` on pointer down (or Space/Enter down) and `false` on release or
 * when the pointer leaves while held; it has no pressed state to report, so it carries no
 * `aria-pressed`, but it still lights while held (`data-on`). Disabled asks nothing. The
 * accessible name is `label`, else `name`.
 *
 * **Parts** (`data-part`): `root`, `caption`, `key` (the button; the theme's `key` material,
 * pressed shadow and lit glow when on, lit in `ink`), `readout` (inside only: the state, which is
 * what lights on a row).
 */
export function Toggle({ children, ...props }: ToggleProps) {
  return <Tree tree={toggleView(props, children !== undefined)} slots={{ children }} handlers={toggleHandlers(props)} />;
}

export interface SwitchProps extends SwitchModelProps {
  /** A name beside it: the switch then sits at the end of a line that labels it, and a click on
   *  the name flips it too (the app's `SwitchRow`). */
  children?: ReactNode;
}

/**
 * A switch: on or off, taking effect at once.
 *
 * **Job.** A setting that is on or off, read at the end of its line.
 *
 * **Behaviour.** A button with `role="switch"` and `aria-checked`, so a click, Space or Enter
 * flips it. Controlled with `checked`, or its own from `defaultChecked`; `onChange` hears the new
 * state either way. Disabled doesn't flip. With `children` it is a whole line (`<label>`): the
 * name at the start, the switch at the end, the name labelling it.
 *
 * **Parts** (`data-part`): `row` (labelled only), `name`, `switch` (the track: the theme's `well`,
 * filled `--selected` and lit when on), `thumb` (the theme's `handle`, at the trailing end when on).
 */
export function Switch({ children, ...props }: SwitchProps) {
  // Its own value (unless `checked` owns it): view state the flip sets.
  const [own] = useState(() => viewState(props.defaultChecked ?? false));
  const value = useSyncExternalStore(own.subscribe, own.get);
  return <Tree tree={switchView(props, value, children !== undefined)} slots={{ children }} handlers={switchHandlers(props, value, own.set)} />;
}

export default Toggle;
