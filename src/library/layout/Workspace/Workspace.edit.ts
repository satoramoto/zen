// The workspace's structural edits (docs/workspace.md): six pure functions, each
// `(spec, …) => ScreenSpec`, all returning new values and never touching CSS. The component calls
// `onSpec(tabId, next, why)`; the app saves the value, and the solver still owns every size, so a
// tab edited on a stage monitor re-themes and steps down on a laptop.
import type { Nest, RegionSpec, Row, ScreenSpec } from '../assembly/types';

/** A writable row and item: what the edits rearrange before pruning hands back a `ScreenSpec`. */
type MRow = MItem[];
type MItem = RegionSpec | (Omit<Nest, 'rows'> & { rows: MRow[] });

/** Where a region sits: the row array holding it, its index, and its top-level row. */
interface Loc {
  container: MRow;
  index: number;
  top: number;
}

/** A mutable copy of the spec's rows: every row and nest cloned, regions shared. */
function cloneRows(rows: readonly Row[]): MRow[] {
  return rows.map((row) =>
    row.map((item): MItem => ('rows' in item ? { ...item, rows: cloneRows(item.rows) } : item)),
  );
}

/** Find the row array holding `regionId`, deepest first, keeping its top-level row. */
function locate(rows: readonly MRow[], regionId: string, top = -1): Loc | null {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let i = 0; i < row.length; i++) {
      const item = row[i];
      if ('rows' in item) {
        const found = locate(item.rows, regionId, top === -1 ? r : top);
        if (found) return found;
      } else if (item.id === regionId) {
        return { container: row, index: i, top: top === -1 ? r : top };
      }
    }
  }
  return null;
}

/** Drop emptied rows and nests, top to bottom; never the last region. */
function prune(rows: MRow[]): MRow[] {
  const kept: MRow[] = [];
  for (const row of rows) {
    const items: MRow = [];
    for (const item of row) {
      if ('rows' in item) {
        const inner = prune(item.rows);
        if (inner.length > 0) items.push({ ...item, rows: inner });
      } else {
        items.push(item);
      }
    }
    if (items.length > 0) kept.push(items);
  }
  return kept;
}

const countRegions = (rows: readonly MRow[]): number =>
  rows.reduce(
    (n, row) => n + row.reduce((m, item) => m + ('rows' in item ? countRegions(item.rows) : 1), 0),
    0,
  );

/** Work on a cloned body; `commit` prunes it back into a new spec, or returns the spec untouched. */
function edit(spec: ScreenSpec, run: (rows: MRow[]) => boolean): ScreenSpec {
  const rows = cloneRows(spec.rows);
  if (!run(rows)) return spec;
  const pruned = prune(rows);
  if (pruned.length === 0 || countRegions(pruned) === 0) return spec;
  return { ...spec, rows: pruned as unknown as Row[] };
}

/** Move a region left or right within its row. */
export function moveRegion(spec: ScreenSpec, regionId: string, dir: 'left' | 'right'): ScreenSpec {
  return edit(spec, (rows) => {
    const at = locate(rows, regionId);
    if (!at) return false;
    const next = at.index + (dir === 'left' ? -1 : 1);
    if (next < 0 || next >= at.container.length) return false;
    const row = at.container;
    [row[at.index], row[next]] = [row[next], row[at.index]];
    return true;
  });
}

/**
 * Move a region up or down into the neighbouring top-level row. A region inside a nest leaves it;
 * its old nest is pruned when empty.
 */
export function moveRegionToRow(spec: ScreenSpec, regionId: string, dir: 'up' | 'down'): ScreenSpec {
  return edit(spec, (rows) => {
    const at = locate(rows, regionId);
    if (!at || at.top < 0) return false;
    const next = at.top + (dir === 'up' ? -1 : 1);
    if (next < 0 || next >= rows.length) return false;
    const [item] = at.container.splice(at.index, 1);
    rows[next].push(item);
    return true;
  });
}

/**
 * Split a region's slot with a new one: its place becomes a nest of two rows (the region, then
 * the addition), so the palette's `+ kind` both splits and fills in one structural edit.
 */
export function splitRegion(spec: ScreenSpec, regionId: string, region: RegionSpec): ScreenSpec {
  return edit(spec, (rows) => {
    const at = locate(rows, regionId);
    if (!at) return false;
    at.container[at.index] = {
      rows: [[at.container[at.index] as RegionSpec], [region]],
    };
    return true;
  });
}

/** Remove a region; its row and any emptied nest go with it. Never the last region. */
export function removeRegion(spec: ScreenSpec, regionId: string): ScreenSpec {
  return edit(spec, (rows) => {
    const at = locate(rows, regionId);
    if (!at) return false;
    at.container.splice(at.index, 1);
    return true;
  });
}

/**
 * Add a region to a top-level row (`index` end by default; past the last row starts one).
 * The palette bar adds to the last row; a region's own `+ kind` splits instead.
 */
export function addRegion(spec: ScreenSpec, rowIndex: number, region: RegionSpec, index?: number): ScreenSpec {
  return edit(spec, (rows) => {
    const at = Math.max(0, Math.min(rowIndex, rows.length));
    if (at === rows.length) {
      rows.push([region]);
      return true;
    }
    const row = rows[at];
    row.splice(index ?? row.length, 0, region);
    return true;
  });
}

/** Every region id in a spec, reading order, so the component knows what it holds. */
export function workspaceRegionIds(spec: ScreenSpec): string[] {
  const ids: string[] = [];
  const walk = (rows: readonly Row[]): void => {
    for (const row of rows)
      for (const item of row) {
        if ('rows' in item) walk(item.rows);
        else ids.push(item.id);
      }
  };
  walk(spec.rows);
  return ids;
}
