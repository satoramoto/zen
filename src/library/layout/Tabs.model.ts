// Tabs' model: its props, the tablist and tabs it draws from them (classes, `data-*`, ARIA, the
// roving tab stop), and the keyboard's next choice. No framework: `Tabs.tsx` (React) and
// `Tabs.svelte` (Svelte) both render `tabsView` and move with `nextTab`.
import type { ElementView, TextModelProps } from '../primitives/Text.model';

/** One tab. `L` is the label: a string here, a React node or a Svelte snippet in a renderer. */
export interface TabItemModel<L = string> {
  id: string;
  label: L;
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
export type TipAction = (node: HTMLElement, key: string) => void | { update?: (key: string) => void; destroy?: () => void };

/** Every Tabs prop but the callbacks' frameworks: `L` is the label type. */
export interface TabsModelProps<L = string> {
  /** The tablist's accessible name. */
  name: string;
  items: TabItemModel<L>[];
  /** The chosen tab's id. An id no tab has (or `null`) leaves none chosen. */
  value: string | null;
  /** Ids for each tab's panel (`aria-controls`), when the tabs switch a panel. */
  panelId?: string;
  /** A tab's DOM id, so a panel can name the chosen one. Default: `tabs-<name>-<id>` (`tabDomId`). */
  tabId?: (id: string) => string;
  /** The app's tooltip action, applied to each tab that has a `tip`, with that tab's key. */
  tipAction?: TipAction;
  /** Called with the tab a click or a key chooses. */
  onChange?: (id: string) => void;
}

/** One tab as drawn: a `Text` rendered as a `<button>`. */
export interface TabView<L = string> {
  /** The item's id (the key in a list, and what `onChange` gets). */
  id: string;
  /** The tab's Text props (its ARIA role is `tab`). */
  text: Omit<TextModelProps, 'ariaRole'> & { ariaRole: 'tab' };
  /** The tab's class (beside Text's own) and its `id`, `type`, `data-*` and ARIA. */
  face: ElementView;
  /** The roving tab stop: 0 for the one stop, -1 for the rest. */
  tabIndex: 0 | -1;
  label: L;
  /** The tooltip key, for the app's `tipAction`. */
  tip: string | undefined;
  /** Whether a click on it chooses it: not disabled and not already chosen. */
  choosable: boolean;
}

export interface TabsView<L = string> {
  list: ElementView;
  tabs: TabView<L>[];
}

/** The default DOM id of a tab: from the tablist's name and the tab's id, so both renderers agree. */
export function tabDomId(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `tabs-${slug}-${id}`;
}

/** The tab that holds the tab stop: the chosen one if enabled, else the first enabled tab. */
export function stopTab<L>(items: TabItemModel<L>[], value: string | null): string | undefined {
  const live = items.filter((t) => !t.disabled);
  return live.some((t) => t.id === value) ? (value ?? undefined) : live[0]?.id;
}

/** The tablist and its tabs, drawn from the props. */
export function tabsView<L>({ name, items, value, panelId, tabId }: TabsModelProps<L>): TabsView<L> {
  const domId = tabId ?? ((id: string) => tabDomId(name, id));
  const stop = stopTab(items, value);
  return {
    list: { className: 'lib-tabs', attrs: { role: 'tablist', 'aria-label': name, 'data-part': 'tabs' } },
    tabs: items.map((t) => {
      const on = t.id === value;
      return {
        id: t.id,
        text: { size: 'label', weight: 'strong', case: 'label', ariaRole: 'tab' },
        face: {
          className: 'lib-tabs__tab',
          attrs: {
            id: domId(t.id),
            type: 'button',
            'data-part': 'tab',
            'aria-selected': String(on),
            'aria-controls': panelId,
            'aria-label': t.name,
            'aria-disabled': t.disabled ? 'true' : undefined,
            'data-tip': t.tip,
          },
        },
        tabIndex: t.id === stop ? 0 : -1,
        label: t.label,
        tip: t.tip,
        choosable: !t.disabled && !on,
      };
    }),
  };
}

/** The tab a key moves the choice to: ← → step through the enabled tabs (wrapping), Home / End
 *  jump to the ends. `null` for any other key, or with no enabled tab. */
export function nextTab<L>(items: TabItemModel<L>[], value: string | null, key: string): string | null {
  const live = items.filter((t) => !t.disabled);
  if (live.length === 0) return null;
  const at = live.findIndex((t) => t.id === value);
  let next = -1;
  if (key === 'ArrowRight') next = (at + 1) % live.length;
  else if (key === 'ArrowLeft') next = at < 0 ? live.length - 1 : (at - 1 + live.length) % live.length;
  else if (key === 'Home') next = 0;
  else if (key === 'End') next = live.length - 1;
  return next < 0 ? null : live[next].id;
}

/** Tab `id`'s element inside `list`, found among the list's own children (so two lists with the
 *  same name, and so the same default ids, never reach each other's tabs). */
export function tabNode<L>(list: HTMLElement | null, view: TabsView<L>, id: string): HTMLElement | undefined {
  const domId = view.tabs.find((t) => t.id === id)?.face.attrs.id;
  if (!list || domId === undefined) return undefined;
  return Array.from(list.children).find((el): el is HTMLElement => el.id === domId);
}
