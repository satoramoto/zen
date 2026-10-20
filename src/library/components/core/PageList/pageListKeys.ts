/**
 * PageList's behaviour, framework-free: a click on a row chooses its page; ↑ ↓ wrap and Home End
 * jump, each move focusing the row and choosing it. Bound on the `nav`, whose element children are
 * the rows, in `ids` order. Controlled: it never marks a row itself. Registered as the `pageList`
 * store (`src/library/view/stores.ts`).
 */

export interface PageListParams {
  /** The pages' ids, in row order. */
  ids: string[];
  /** Called with a page's id on a click or a move. */
  onChoose?: (id: string) => void;
}

const MOVES = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

/** Listens on `node` (the nav) for clicks and keys on its rows. */
export function bindPageList(node: HTMLElement, initial: PageListParams): { update(params: PageListParams): void; destroy(): void } {
  let params = initial;

  /** The row an event happened in, and its index; -1 outside every row. */
  const rowOf = (target: EventTarget | null): number => {
    const rows = [...node.children];
    return rows.findIndex((row) => target instanceof Node && row.contains(target));
  };

  function onClick(event: MouseEvent) {
    const index = rowOf(event.target);
    if (index >= 0 && index < params.ids.length) params.onChoose?.(params.ids[index]);
  }

  function onKeyDown(event: KeyboardEvent) {
    const { ids } = params;
    const index = rowOf(event.target);
    if (index < 0 || !MOVES.includes(event.key) || ids.length === 0) return;
    event.preventDefault();
    const to = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: ids.length - 1 }[event.key as 'Home'];
    const target = (to + ids.length) % ids.length;
    (node.children[target] as HTMLElement | undefined)?.focus();
    params.onChoose?.(ids[target]);
  }

  node.addEventListener('click', onClick);
  node.addEventListener('keydown', onKeyDown);
  return {
    update(next) {
      params = next;
    },
    destroy() {
      node.removeEventListener('click', onClick);
      node.removeEventListener('keydown', onKeyDown);
    },
  };
}
