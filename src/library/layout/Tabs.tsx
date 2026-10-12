import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
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

export interface TabsProps {
  /** The tablist's accessible name. */
  name: string;
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Ids for each tab's panel (`aria-controls`), when the tabs switch a panel. */
  panelId?: string;
  /** A tab's DOM id, so a panel can name the chosen one. */
  tabId?: (id: string) => string;
}

/**
 * **Job.** Choose one of a few views or layers. A recessed `well` track with the choices printed
 * in it; the chosen one is a raised `key` inside the track, like a selector switch. Region draws
 * its views with it, and a region's `aside` uses it for a second switch (the mixer's layers), so
 * every switch on a screen is one object.
 *
 * **Behaviour.** A `tablist`: ← → move (skipping disabled), Home / End jump to the ends; focus
 * follows the choice.
 */
export function Tabs({ name, items, value, onChange, panelId, tabId }: TabsProps) {
  const uid = useId();
  const id = tabId ?? ((v: string) => `${uid}-${v}`);
  const list = useRef<HTMLDivElement>(null);

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const live = items.filter((t) => !t.disabled);
    const at = live.findIndex((t) => t.id === value);
    let next = -1;
    if (event.key === 'ArrowRight') next = (at + 1) % live.length;
    else if (event.key === 'ArrowLeft') next = (at - 1 + live.length) % live.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = live.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onChange(live[next].id);
    list.current?.ownerDocument.getElementById(id(live[next].id))?.focus();
  };

  return (
    <div ref={list} className="lib-tabs" role="tablist" aria-label={name} data-part="tabs" onKeyDown={keyDown}>
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            id={id(t.id)}
            type="button"
            role="tab"
            className="lib-tabs__tab"
            data-part="tab"
            aria-selected={on}
            aria-controls={panelId}
            aria-label={t.name}
            aria-disabled={t.disabled || undefined}
            tabIndex={on ? 0 : -1}
            data-tip={t.tip}
            onClick={() => !t.disabled && !on && onChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
