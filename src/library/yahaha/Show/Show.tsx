import { useState } from 'react';
import { Tree } from '../../view/Tree';
import { SHOW_START } from './Show.spec';
import { showHandlers, showTab, showView, type ShowModelProps } from './Show.model';
// The set name is Text; the JAM lamp, tabs and screen bring their own styles. Before Show.css.
import '../../primitives/Text.css';
import './Show.css';

// The props, the dataset and the tree are framework-free, in the model and Show.data.ts;
// `Show.svelte` draws the same tree with the same tab state.
export { LIVE_SHOW, type ShowData } from './Show.data';
export { SHOW_ARP_SPEC, SHOW_GRID_SPEC, SHOW_MIX_SPEC, SHOW_STAGE_SPEC, SHOW_START, SHOW_STEMS_SPEC, SHOW_TABS } from './Show.spec';
export { showTab, type ShowModelProps } from './Show.model';

/** Show's props: the dataset and the open tab, everything else asks. */
export type ShowProps = ShowModelProps & {
  /** The open tab's id; the show starts on the stage. Uncontrolled after mount. */
  active?: string;
};

/**
 * **Job.** The sample set on one screen: seven songs and a jam across five Lemur tabs — My
 * stage, Session grid, Arp & follow, Mix & sends, Stem deck. The tab strip and a JAM lamp stay
 * put; the open tab's Screen assembles itself underneath. Docs: `docs/live-views.md`.
 *
 * **Changed.** *Hierarchy*: the set name, bar and chord sit in the bar beside the tabs (Live's
 * control bar), so the body is all instrument. *JAM* is a record lamp in the bar: lit, the grid
 * stays live past the arrangement.
 *
 * **Kept.** The show holds the dataset and the tab; every widget only asks (launch, levels,
 * sends, fires, cues) and changes nothing itself, so the sample plays the same under any store.
 *
 * **Tuning knobs.**
 * - `--yh-show-gap`: between the bar and the screen.
 */
export function Show(props: ShowProps) {
  const [active, setActive] = useState(props.active ?? SHOW_START);
  const tab = showTab(active);
  return (
    <Tree
      tree={showView({ ...props, active }, tab)}
      handlers={showHandlers({
        ...props,
        onTab: (id: string) => {
          setActive(id);
          props.onTab?.(id);
        },
      })}
    />
  );
}

export default Show;
