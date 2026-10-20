// Tabs' model: its props, the tree it draws from them (the tablist and its tabs: classes, `data-*`,
// ARIA, the roving tab stop, each tab's tooltip store) and the handlers that tree names (a click
// chooses, the keyboard moves). No framework: `Tabs.tsx` (React) and `Tabs.svelte` (Svelte) both
// pass `tabsView`, `tabsSlots` and `tabsHandlers` to their `Tree`.
import { textNode } from '../primitives/Text.model';
import { each, h, slot, wire, type Handlers, type Node } from '../view/Tree.model';
import type { TipAction } from '../view/tip';

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
 * the library's controls take (the `tip` store's, `view/tip.ts`).
 */
export type { TipAction };

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

/** The slot a tab's label fills when it isn't plain text (a React node, a Svelte snippet). */
export const tabLabelSlot = (id: string): string => `label:${id}`;

/** The labels that aren't plain text, by their slot (`tabLabelSlot`): what a binding passes as
 *  `slots`. A string label is drawn in the tree itself. */
export function tabsSlots<L>(items: TabItemModel<L>[]): Record<string, Exclude<L, string>> {
  const slots: Record<string, Exclude<L, string>> = {};
  for (const t of items) if (typeof t.label !== 'string') slots[tabLabelSlot(t.id)] = t.label as Exclude<L, string>;
  return slots;
}

/** A tab's DOM id, from `tabId` or the default. */
const domIdOf =
  ({ name, tabId }: Pick<TabsModelProps<unknown>, 'name' | 'tabId'>) =>
  (id: string): string =>
    tabId ? tabId(id) : tabDomId(name, id);

/** The handler key of a click on tab `id`. */
const chooseKey = (id: string) => `choose:${id}`;

/**
 * The tree Tabs draws: a `tablist` (keys call `key`) holding a keyed list of `label` Texts as
 * `<button>`s, each with its id, ARIA, roving tab stop, a click (`choose:<id>`) and the `tip` store.
 * A string label is text; any other label is the slot `label:<id>` (`tabsSlots`).
 */
export function tabsView<L>(props: TabsModelProps<L>): Node {
  const { name, items, value, panelId } = props;
  const domId = domIdOf(props);
  const stop = stopTab(items, value);
  return wire(
    h(
      'div',
      { class: 'lib-tabs', role: 'tablist', 'aria-label': name, 'data-part': 'tabs' },
      each(
        items,
        (t) => t.id,
        (t) =>
          wire(
            textNode(
              { as: 'button', size: 'label', weight: 'strong', case: 'label', ariaRole: 'tab', className: 'lib-tabs__tab' },
              {
                id: domId(t.id),
                type: 'button',
                'data-part': 'tab',
                'aria-selected': String(t.id === value),
                'aria-controls': panelId,
                'aria-label': t.name,
                'aria-disabled': t.disabled ? 'true' : undefined,
                'data-tip': t.tip,
                tabindex: t.id === stop ? '0' : '-1',
              },
              typeof t.label === 'string' ? t.label : slot(tabLabelSlot(t.id)),
            ),
            { on: { click: chooseKey(t.id) }, bind: [['tip', { tip: t.tip, tipAction: 'tipAction' }]] },
          ),
      ),
    ),
    { on: { keydown: 'key' } },
  );
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

/**
 * The callbacks `tabsView`'s tree names: `key` (the keyboard: `nextTab`, then focus follows to that
 * tab among the tablist's own children, so two lists with the same name never reach each other's
 * tabs), `choose:<id>` per tab (a click on a tab that is neither disabled nor chosen) and the
 * tooltip's `tipAction`.
 */
export function tabsHandlers<L>(props: TabsModelProps<L>): Handlers {
  const { items, value, onChange, tipAction } = props;
  const domId = domIdOf(props);
  const handlers: Handlers = {
    key: (event: KeyboardEvent) => {
      const next = nextTab(items, value, event.key);
      if (next === null) return;
      event.preventDefault();
      event.stopPropagation();
      onChange?.(next);
      const id = domId(next);
      const list = event.currentTarget as HTMLElement | null;
      Array.from(list?.children ?? [])
        .find((el): el is HTMLElement => el.id === id)
        ?.focus();
    },
    tipAction,
  };
  for (const t of items) {
    handlers[chooseKey(t.id)] = () => {
      if (!t.disabled && t.id !== value) onChange?.(t.id);
    };
  }
  return handlers;
}
