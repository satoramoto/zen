import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { disclosureHandlers, disclosureView, type DisclosureModelProps } from './Disclosure.model';
import '../Toggle/size.css';
import './Disclosure.css';

// The props and the tree are framework-free, in the model; this file and `Disclosure.svelte` only
// hand its tree to their `Tree`, with its own value as their view state.
export type { DisclosureModelProps } from './Disclosure.model';

export type DisclosureProps = DisclosureModelProps;

/**
 * A disclosure button: shows or hides what it names.
 *
 * **Job.** Open the details under a row or a section (Advanced options) without leaving the page.
 *
 * **Behaviour.** A button with `aria-expanded` (and `aria-controls` when `controls` is given), so
 * a click, Space or Enter turns it. Controlled with `expanded` or its own from `defaultExpanded`;
 * `onChange` hears the new state. The chevron points down when closed and up when open. Disabled
 * doesn't turn.
 *
 * **Parts** (`data-part`): `root` (the button: a square of the size's height, the theme's `key`
 * material, its pressed shadow while held), `chevron`.
 */
export function Disclosure(props: DisclosureProps) {
  // Its own value (unless `expanded` owns it): view state the flip sets.
  const [own] = useState(() => viewState(props.defaultExpanded ?? false));
  const value = useSyncExternalStore(own.subscribe, own.get);
  return <Tree tree={disclosureView(props, value)} handlers={disclosureHandlers(props, value, own.set)} />;
}

export default Disclosure;
