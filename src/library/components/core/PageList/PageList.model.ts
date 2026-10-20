// PageList's model: its props, the tree it draws from them (the nav and one body `Text` button per
// page) and the handlers that tree names. No framework: `PageList.tsx` (React) and `PageList.svelte`
// (Svelte) both pass `pageListView` and `pageListHandlers` to their `Tree`; the clicks and the keys
// are the `pageList` store beside it (`pageListKeys.ts`), registered in `src/library/view/stores.ts`.
import { textNode } from '../../../primitives/Text.model';
import { each, h, wire, type Handlers, type Node } from '../../../view/Tree.model';

/** One page in a PageList. */
export interface PageItem {
  /** What `onChoose` carries and `chosen` names. */
  id: string;
  /** The page's name ("Chord & Split"). */
  label: string;
  /** The tooltip key, set as `data-tip`. */
  tip?: string;
}

export interface PageListModelProps {
  /** The pages, top to bottom. */
  pages: PageItem[];
  /** The open page's `id`; `null`: none. */
  chosen?: string | null;
  /** The list's accessible name ("Settings pages"). */
  label?: string;
  /** Called with a page's `id` on a click, or when ↑ ↓ Home End move to it. */
  onChoose?: (id: string) => void;
}

/**
 * The tree PageList draws: a `nav` named by `label`, binding the `pageList` store (clicks and
 * ↑ ↓ Home End), holding one strong, tabular body `Text` button per page, the open one
 * `aria-current="page"`, its name in a `__name` span.
 */
export function pageListView({ pages, chosen = null, label = 'Pages' }: PageListModelProps): Node {
  return wire(
    h(
      'nav',
      { class: 'yh-page-list', 'aria-label': label },
      each(
        pages,
        (page) => page.id,
        (page) =>
          textNode(
            { as: 'button', role: 'body', weight: 'strong', tabular: true, className: 'yh-page-list__row' },
            { type: 'button', 'aria-current': page.id === chosen ? 'page' : undefined, 'data-tip': page.tip },
            h('span', { class: 'yh-page-list__name' }, page.label),
          ),
      ),
    ),
    { bind: [['pageList', { ids: pages.map((page) => page.id), onChoose: 'choose' }]] },
  );
}

/** The callbacks `pageListView`'s tree names: a page chosen. */
export function pageListHandlers(props: PageListModelProps): Handlers {
  return { choose: props.onChoose };
}
