// Tabs as the DOM renderer draws it: the same tree as `Tabs.tsx` and `Tabs.svelte`; every other prop lands on its root.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { tabsHandlers, tabsSlots, tabsView, type TabsModelProps } from './Tabs.model';
import '../../primitives/Text/Text.css';
import './Tabs.css';

export const TabsDom = domPart<TabsModelProps<string | DomFill>>({ events: ['onChange'], value: { prop: 'value', on: 'onChange' } }, (props) => ({
  tree: tabsView(props),
  slots: tabsSlots(props.items),
  handlers: tabsHandlers(props),
}));
