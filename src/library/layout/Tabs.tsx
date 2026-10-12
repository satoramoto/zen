import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Text } from '../primitives/Text';
import './Tabs.css';

export interface TabItem {
  id: string;
  label: ReactNode;
  /** The tab's accessible name when the label isn't plain text. */
  name?: string;
  disabled?: boolean;
  /** The tooltip key, rendered as `data-tip`. */
  tip?: string;
}

/**
 * The app's tooltip hook (Svelte's `use:tip` shape): called with a tab's node and its `tip` key;
 * the handle it returns is destroyed when the key changes or the tab unmounts. The same signature
 * the library's controls take.
 */
export type TipAction = (
  node: HTMLElement,
  key: string,
) => void | { update?: (key: string) => void; destroy?: () => void };

export interface TabsProps {
  /** The tablist's accessible name. */
  name: string;
  items: TabItem[];
  /** The chosen tab's id. An id no tab has (or `null`) leaves none chosen. */
  value: string | null;
  onChange: (id: string) => void;
  /** Ids for each tab's panel (`aria-controls`), when the tabs switch a panel. */
  panelId?: string;
  /** A tab's DOM id, so a panel can name the chosen one. */
  tabId?: (id: string) => string;
  /** The app's tooltip action, applied to each tab that has a `tip`, with that tab's key. */
  tipAction?: TipAction;
}

interface TabProps {
  item: TabItem;
  domId: string;
  on: boolean;
  stop: boolean;
  panelId?: string;
  tipAction?: TipAction;
  onChoose: () => void;
}

function Tab({ item: t, domId, on, stop, panelId, tipAction, onChoose }: TabProps) {
  const [node, setNode] = useState<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (!node || !tipAction || t.tip === undefined) return;
    const handle = tipAction(node, t.tip);
    return () => handle?.destroy?.();
  }, [node, t.tip, tipAction]);
  return (
    <Text
      as="button"
      size="label"
      weight="strong"
      case="label"
      ref={setNode}
      id={domId}
      type="button"
      ariaRole="tab"
      className="lib-tabs__tab"
      data-part="tab"
      aria-selected={on}
      aria-controls={panelId}
      aria-label={t.name}
      aria-disabled={t.disabled || undefined}
      tabIndex={stop ? 0 : -1}
      data-tip={t.tip}
      onClick={() => !t.disabled && !on && onChoose()}
    >
      {t.label}
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
 * runs the app's tooltip on each tab with its own `tip`.
 */
export function Tabs({ name, items, value, onChange, panelId, tabId, tipAction }: TabsProps) {
  const uid = useId();
  const id = tabId ?? ((v: string) => `${uid}-${v}`);
  const list = useRef<HTMLDivElement>(null);
  const live = items.filter((t) => !t.disabled);
  const stopId = live.some((t) => t.id === value) ? value : live[0]?.id;

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const at = live.findIndex((t) => t.id === value);
    let next = -1;
    if (event.key === 'ArrowRight') next = (at + 1) % live.length;
    else if (event.key === 'ArrowLeft') next = at < 0 ? live.length - 1 : (at - 1 + live.length) % live.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = live.length - 1;
    if (next < 0 || live.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    onChange(live[next].id);
    list.current?.ownerDocument.getElementById(id(live[next].id))?.focus();
  };

  return (
    <div ref={list} className="lib-tabs" role="tablist" aria-label={name} data-part="tabs" onKeyDown={keyDown}>
      {items.map((t) => (
        <Tab
          key={t.id}
          item={t}
          domId={id(t.id)}
          on={t.id === value}
          stop={t.id === stopId}
          panelId={panelId}
          tipAction={tipAction}
          onChoose={() => onChange(t.id)}
        />
      ))}
    </div>
  );
}
