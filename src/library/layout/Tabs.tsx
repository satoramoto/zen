import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Text } from '../primitives/Text';
import { nextTab, tabNode, tabsView, type TabItemModel, type TabsModelProps, type TabView, type TipAction } from './Tabs.model';
import './Tabs.css';

// The view and the keyboard are framework-free, in the model; `Tabs.svelte` renders the same view.
export { tabDomId, tabsView, nextTab, stopTab, type TabItemModel, type TabsModelProps, type TipAction } from './Tabs.model';

export type TabItem = TabItemModel<ReactNode>;

export interface TabsProps extends Omit<TabsModelProps<ReactNode>, 'onChange'> {
  onChange: (id: string) => void;
}

function Tab({ tab, tipAction, onChoose }: { tab: TabView<ReactNode>; tipAction?: TipAction; onChoose: () => void }) {
  const [node, setNode] = useState<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!node || !tipAction || tab.tip === undefined) return;
    const handle = tipAction(node, tab.tip);
    return () => handle?.destroy?.();
  }, [node, tab.tip, tipAction]);
  return (
    <Text
      as="button"
      {...tab.text}
      ref={setNode}
      className={tab.face.className}
      {...tab.face.attrs}
      tabIndex={tab.tabIndex}
      onClick={() => tab.choosable && onChoose()}
    >
      {tab.label}
    </Text>
  );
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
 * `tabs-<name>-<id>` by default.
 */
export function Tabs(props: TabsProps) {
  const { items, value, onChange, tipAction } = props;
  const view = tabsView(props);
  const list = useRef<HTMLDivElement>(null);

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = nextTab(items, value, event.key);
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    onChange(next);
    tabNode(list.current, view, next)?.focus();
  };

  return (
    <div ref={list} className={view.list.className} {...view.list.attrs} onKeyDown={keyDown}>
      {view.tabs.map((t) => (
        <Tab key={t.id} tab={t} tipAction={tipAction} onChoose={() => onChange(t.id)} />
      ))}
    </div>
  );
}
