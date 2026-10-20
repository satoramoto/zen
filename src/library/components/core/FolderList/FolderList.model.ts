// FolderList's model: its props, the tree it draws from them (the nav, one body `Text` button per
// row with its split name and count) and the handlers that tree names. No framework:
// `FolderList.tsx` (React) and `FolderList.svelte` (Svelte) both pass `folderListView` and
// `folderListHandlers` to their `Tree`, keeping the roving tab stop as view state
// (`view/viewState.ts`); the clicks, keys and focus are the `folderList` store beside
// it (`folderListKeys.ts`), registered in `src/library/view/stores.ts`.
import { textNode } from '../../../primitives/Text.model';
import { each, h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';

/** One row of a FolderList: a style folder or a sound category. */
export interface FolderItem {
  /** What `onChoose` carries and what `chosen` names. Unique within the list. */
  id: string;
  /** The folder's name ("Pop & Rock"). */
  label: string;
  /** The count at the right end ("128"). */
  count?: string;
  /** The tooltip key, set as `data-tip` for the app's tooltip layer. */
  tip?: string;
  /** Shown, not choosable (an empty or unreadable folder). */
  disabled?: boolean;
}

export interface FolderListModelProps {
  /** The rows, top to bottom. */
  items: FolderItem[];
  /** The `id` of the chosen row; `null` = none. A click never moves it: the parent does. */
  chosen?: string | null;
  /** The nav's accessible name ("Style folders"). */
  label: string;
  /** A fixed width in px. Default: fills its container. */
  width?: number;
  /** A fixed height in px. Default: fills its container's height. */
  height?: number;
  /** Called with a row's `id` on a click, or when ↑ ↓ Home End move to it. */
  onChoose?: (id: string) => void;
}

/**
 * The row holding the tab stop, as view state: `active`, set while `chosen` was `seen`. When
 * `chosen` changes (or there is none yet), the tab stop goes back to `chosen`.
 */
export interface FolderListLocal {
  active: string | null;
  seen: string | null;
}

/** Labels longer than this keep their last word whole, so the ellipsis falls mid-name. */
const LONG = 24;

/** Split a long label into a head that may truncate and a short tail that never does. */
export function splitLabel(label: string): [string, string] {
  if (label.length <= LONG) return [label, ''];
  const at = label.lastIndexOf(' ');
  if (at <= 0 || label.length - at > 14) return [label, ''];
  return [label.slice(0, at + 1), label.slice(at + 1)];
}

/**
 * The tree FolderList draws: a sized `nav` binding the `folderList` store, one body `Text` button
 * per row (the chosen one strong and `aria-current`, the tab stop `tabindex="0"`), its name as a
 * head and an unbreakable tail, then its count as a caption `Text`.
 */
export function folderListView(
  { items, chosen = null, label, width, height }: FolderListModelProps,
  local: FolderListLocal | null = null,
): Node {
  const active = local !== null && local.seen === chosen ? local.active : chosen;
  const enabled = items.flatMap((item, i) => (item.disabled ? [] : [i]));
  const activeIndex = items.findIndex((item) => item.id === active);
  const stop = activeIndex >= 0 && !items[activeIndex].disabled ? activeIndex : (enabled[0] ?? -1);
  return wire(
    h(
      'nav',
      {
        class: 'yh-folder-list',
        'aria-label': label,
        style: styleText({ width: width === undefined ? '100%' : `${width}px`, height: height === undefined ? '100%' : `${height}px` }),
      },
      each(
        items,
        (item) => item.id,
        (item, i) => {
          const isChosen = item.id === chosen;
          const [head, tail] = splitLabel(item.label);
          return textNode(
            { as: 'button', role: 'body', weight: isChosen ? 'strong' : undefined, className: 'yh-folder-list__row' },
            {
              type: 'button',
              // Named outright: the split name's pieces would otherwise be joined without their space.
              'aria-label': tail && item.count !== undefined ? `${item.label} ${item.count}` : tail ? item.label : undefined,
              'aria-current': isChosen ? 'true' : undefined,
              disabled: item.disabled ? '' : undefined,
              tabindex: i === stop ? '0' : '-1',
              'data-tip': item.tip,
            },
            h(
              'span',
              { class: 'yh-folder-list__label' },
              h('span', { class: 'yh-folder-list__head' }, head),
              tail ? h('span', { class: 'yh-folder-list__tail' }, tail) : null,
            ),
            when(item.count !== undefined, () => [' ', textNode({ role: 'caption', tabular: true, className: 'yh-folder-list__count' }, {}, item.count!)]),
          );
        },
      ),
    ),
    {
      bind: [
        [
          'folderList',
          { rows: items.map((item) => ({ id: item.id, disabled: item.disabled === true })), chosen, onChoose: 'choose', onActive: 'activate' },
        ],
      ],
    },
  );
}

/** The callbacks `folderListView`'s tree names: a row chosen, and the tab stop moved (`set` is the
 *  binding's view state). */
export function folderListHandlers(props: FolderListModelProps, set?: (local: FolderListLocal) => void): Handlers {
  return {
    choose: props.onChoose,
    activate: (id: string | null) => set?.({ active: id, seen: props.chosen ?? null }),
  };
}
