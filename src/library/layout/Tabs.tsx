import type { ReactNode } from 'react';
import { Tree } from '../view/Tree';
import { tabsHandlers, tabsSlots, tabsView, type TabItemModel, type TabsModelProps } from './Tabs.model';
import '../primitives/Text.css';
import './Tabs.css';

// The view, the keyboard and the tooltips are framework-free, in the model; this file and
// `Tabs.svelte` only hand the model's tree to their `Tree`.
export { tabDomId, tabsView, tabsHandlers, nextTab, stopTab, type TabItemModel, type TabsModelProps, type TipAction } from './Tabs.model';

export type TabItem = TabItemModel<ReactNode>;

export interface TabsProps extends Omit<TabsModelProps<ReactNode>, 'onChange'> {
  onChange: (id: string) => void;
}

/**
 * **Job.** Choose one of a few views or layers. A recessed `well` track with the choices printed
 * in it; the chosen one is a raised `key` inside the track, like a selector switch. Region draws
 * its views with it, and a region's `aside` uses it for a second switch (the mixer's layers), so
 * every switch on a screen is one object.
 *
 * **Behaviour.** A `tablist`: ← → move (skipping disabled), Home / End jump to the ends; focus
 * follows the choice. With none chosen, the first enabled tab takes the tab stop. `tipAction`
 * runs the app's tooltip on each tab with its own `tip`. Each tab's DOM id is `tabId(id)`, or
 * `tabs-<name>-<id>` by default. A label that isn't a string is drawn in the slot `label:<id>`.
 */
export function Tabs(props: TabsProps) {
  return <Tree tree={tabsView(props)} slots={tabsSlots(props.items)} handlers={tabsHandlers(props)} />;
}
