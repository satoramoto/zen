// A grid of cells holding things that span whole cells and never overlap (a control panel's
// controls). Pure: every edit returns the next cells, or the same array when nothing changed. A
// cell's place is `x`, `y` (0-based columns and rows) and its size `w`, `h` (in cells).

export interface GridCell {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridSize {
  columns: number;
  rows: number;
}

const overlaps = (a: GridCell, b: GridCell): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Whether `cell` lies inside the grid and overlaps no other cell (ignoring its own id). */
export function fits<C extends GridCell>(cells: readonly C[], cell: GridCell, size: GridSize): boolean {
  if (cell.w < 1 || cell.h < 1 || cell.x < 0 || cell.y < 0 || cell.x + cell.w > size.columns || cell.y + cell.h > size.rows) return false;
  return !cells.some((c) => c.id !== cell.id && overlaps(c, cell));
}

/** Whether a cell reaches past the grid (a grid made smaller than its cells): drawn clipped, never removed. */
export const clipped = (cell: GridCell, size: GridSize): boolean => cell.x + cell.w > size.columns || cell.y + cell.h > size.rows;

/** The id of the cell covering grid position (x, y), if any. */
export const cellAt = <C extends GridCell>(cells: readonly C[], x: number, y: number): C | undefined => cells.find((c) => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);

/** Every grid position no cell covers, row by row. */
export function freePositions(cells: readonly GridCell[], size: GridSize): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < size.rows; y++) for (let x = 0; x < size.columns; x++) if (!cellAt(cells, x, y)) out.push({ x, y });
  return out;
}

/**
 * `cell` placed with its top-left at (x, y): at its size if that fits, else shrunk (width first, then
 * height) to what does, else at 1 × 1. Undefined when even 1 × 1 doesn't fit (the position is taken).
 */
export function place<C extends GridCell>(cells: readonly C[], cell: C, size: GridSize): readonly C[] | undefined {
  for (let h = cell.h; h >= 1; h--)
    for (let w = cell.w; w >= 1; w--) {
      const next = { ...cell, w, h };
      if (fits(cells, next, size)) return [...cells.filter((c) => c.id !== cell.id), next];
    }
  return undefined;
}

/** The positions from (x0, y0) to (x1, y1), one cell at a time (a line, as a pointer would sweep it). */
function path(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  const out: { x: number; y: number }[] = [];
  for (let i = 1; i <= steps; i++) out.push({ x: Math.round(x0 + ((x1 - x0) * i) / steps), y: Math.round(y0 + ((y1 - y0) * i) / steps) });
  return out;
}

/** Cell `id` moved toward (x, y): it stops at the last free position on the way, so it never lands on another cell. */
export function moveTo<C extends GridCell>(cells: readonly C[], id: string, x: number, y: number, size: GridSize): readonly C[] {
  const cell = cells.find((c) => c.id === id);
  if (!cell) return cells;
  let at = { x: cell.x, y: cell.y };
  for (const p of path(cell.x, cell.y, x, y)) {
    if (!fits(cells, { ...cell, ...p }, size)) break;
    at = p;
  }
  if (at.x === cell.x && at.y === cell.y) return cells;
  return cells.map((c) => (c.id === id ? { ...c, ...at } : c));
}

/** Cell `id` resized toward `w` × `h` (at least 1 × 1): it grows only into free cells inside the grid. */
export function resizeTo<C extends GridCell>(cells: readonly C[], id: string, w: number, h: number, size: GridSize): readonly C[] {
  const cell = cells.find((c) => c.id === id);
  if (!cell) return cells;
  let best = { w: cell.w, h: cell.h };
  const want = { w: Math.max(1, w), h: Math.max(1, h) };
  // Step each axis toward the target, keeping each step that still fits.
  for (const axis of ['w', 'h'] as const) {
    const dir = Math.sign(want[axis] - best[axis]);
    while (best[axis] !== want[axis]) {
      const next = { ...best, [axis]: best[axis] + dir };
      if (!fits(cells, { ...cell, ...next }, size)) break;
      best = next;
    }
  }
  if (best.w === cell.w && best.h === cell.h) return cells;
  return cells.map((c) => (c.id === id ? { ...c, ...best } : c));
}

/** The cells without `id`. */
export const removeCell = <C extends GridCell>(cells: readonly C[], id: string): readonly C[] => (cells.some((c) => c.id === id) ? cells.filter((c) => c.id !== id) : cells);
