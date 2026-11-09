// A control panel's cell drag, framework-free (registered as `liveCellDrag` in registry.stores.ts):
// a press on a control's tag (`move`) or its corner (`resize`) followed past a few pixels becomes a
// drag that previews the cell's next place or size in whole grid cells, and commits it on release.
// Where it may go (inside the grid, never over another control) is the handler's (`layout/cells.ts`).

export interface CellRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CellDragParams {
  /** The cell this handle drags. */
  id: string;
  mode: 'move' | 'resize';
  /** The place or size under the pointer while dragging, null when it ends. */
  onPreview?: (rect: CellRect | null) => void;
  /** The place or size the drag ends with. */
  onCommit?: (rect: CellRect) => void;
}

/** Pointer travel before a press becomes a drag. */
export const CELL_DRAG_THRESHOLD_PX = 6;

/** The grid's track count on an axis, from its computed template. */
const tracks = (template: string): number => template.split(' ').filter(Boolean).length || 1;

export function bindCellDrag(node: HTMLElement, initial: CellDragParams) {
  let params = initial;
  let press: { pointer: number; x: number; y: number; dragging: boolean; from: CellRect; cw: number; ch: number; last?: CellRect } | null = null;
  const swallow = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const down = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const cell = node.closest<HTMLElement>('[data-cell]');
    const grid = node.closest<HTMLElement>('[data-part="grid"]');
    if (!cell || !grid) return;
    const g = grid.getBoundingClientRect();
    const cs = getComputedStyle(grid);
    const cw = g.width / tracks(cs.gridTemplateColumns);
    const ch = g.height / tracks(cs.gridTemplateRows);
    const c = cell.getBoundingClientRect();
    const from = { x: Math.round((c.left - g.left) / cw), y: Math.round((c.top - g.top) / ch), w: Math.max(1, Math.round(c.width / cw)), h: Math.max(1, Math.round(c.height / ch)) };
    press = { pointer: e.pointerId, x: e.clientX, y: e.clientY, dragging: false, from, cw, ch };
    if (params.mode === 'resize') e.preventDefault();
  };
  const move = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.pointer) return;
    if (!press.dragging) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < CELL_DRAG_THRESHOLD_PX) return;
      press.dragging = true;
      try {
        node.setPointerCapture(e.pointerId);
      } catch {
        // A synthetic pointer: followed through the events dispatched to the node.
      }
    }
    e.preventDefault();
    const dx = Math.round((e.clientX - press.x) / press.cw);
    const dy = Math.round((e.clientY - press.y) / press.ch);
    const { from } = press;
    const next = params.mode === 'move' ? { ...from, x: from.x + dx, y: from.y + dy } : { ...from, w: Math.max(1, from.w + dx), h: Math.max(1, from.h + dy) };
    if (press.last && next.x === press.last.x && next.y === press.last.y && next.w === press.last.w && next.h === press.last.h) return;
    press.last = next;
    params.onPreview?.(next);
  };
  const end = (commit: boolean) => (e: PointerEvent) => {
    if (!press || e.pointerId !== press.pointer) return;
    const { dragging, last } = press;
    press = null;
    if (!dragging) return;
    params.onPreview?.(null);
    node.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => node.removeEventListener('click', swallow, { capture: true }), 0);
    if (commit && last) params.onCommit?.(last);
  };
  const up = end(true);
  const cancel = end(false);

  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', cancel);
  return {
    update(next: CellDragParams) {
      params = next;
    },
    destroy() {
      if (press?.dragging) params.onPreview?.(null);
      press = null;
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
    },
  };
}
