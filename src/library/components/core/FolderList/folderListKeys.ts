/**
 * FolderList's behaviour, framework-free: a click on a row chooses it; ↑ ↓ Home End move focus to
 * the next enabled row and choose it, stopping at the ends and skipping disabled rows, and never
 * reach the page (stopped as well as defaulted). The roving tab stop follows focus (`onActive`
 * with the focused row's id) and goes back to `chosen` when focus leaves the list. Bound on the
 * `nav`, whose element children are the rows, in `rows` order. Registered as the `folderList`
 * store (`src/library/view/stores.ts`).
 */

export interface FolderListParams {
  /** The rows' ids and whether each is disabled, in order. */
  rows: { id: string; disabled: boolean }[];
  /** The chosen row's id, where the tab stop goes back to when focus leaves. */
  chosen: string | null;
  /** Called with a row's id on a click or a move. */
  onChoose?: (id: string) => void;
  /** Called with the id of the row that should hold the tab stop. */
  onActive?: (id: string | null) => void;
}

const MOVES = ['ArrowUp', 'ArrowDown', 'Home', 'End'];

/** Listens on `node` (the nav) for clicks, keys and focus on its rows. */
export function bindFolderList(node: HTMLElement, initial: FolderListParams): { update(params: FolderListParams): void; destroy(): void } {
  let params = initial;

  /** The index of the row an event happened in; -1 outside every row. */
  const rowOf = (target: EventTarget | null): number =>
    [...node.children].findIndex((row) => target instanceof Node && row.contains(target));

  function onClick(event: MouseEvent) {
    const row = params.rows[rowOf(event.target)];
    if (row && !row.disabled) params.onChoose?.(row.id);
  }

  function onKeyDown(event: KeyboardEvent) {
    const index = rowOf(event.target);
    if (index < 0 || !MOVES.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const { rows } = params;
    const enabled = rows.flatMap((row, i) => (row.disabled ? [] : [i]));
    if (enabled.length === 0) return;
    const at = enabled.indexOf(index);
    let target: number;
    if (event.key === 'Home') target = enabled[0];
    else if (event.key === 'End') target = enabled[enabled.length - 1];
    else if (event.key === 'ArrowDown') target = enabled[Math.min(at + 1, enabled.length - 1)];
    else target = enabled[Math.max(at - 1, 0)];
    if (target === index) return;
    const row = rows[target];
    params.onActive?.(row.id);
    (node.children[target] as HTMLElement | undefined)?.focus();
    params.onChoose?.(row.id);
  }

  function onFocusIn(event: FocusEvent) {
    const row = params.rows[rowOf(event.target)];
    if (row) params.onActive?.(row.id);
  }

  function onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !node.contains(next)) params.onActive?.(params.chosen);
  }

  node.addEventListener('click', onClick);
  node.addEventListener('keydown', onKeyDown);
  node.addEventListener('focusin', onFocusIn);
  node.addEventListener('focusout', onFocusOut);
  return {
    update(next) {
      params = next;
    },
    destroy() {
      node.removeEventListener('click', onClick);
      node.removeEventListener('keydown', onKeyDown);
      node.removeEventListener('focusin', onFocusIn);
      node.removeEventListener('focusout', onFocusOut);
    },
  };
}
