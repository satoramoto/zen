import { describe, expect, it } from 'vitest';
import { cellAt, clipped, fits, freePositions, moveTo, place, removeCell, resizeTo, type GridCell } from './cells';

const size = { columns: 4, rows: 3 };
const a: GridCell = { id: 'a', x: 0, y: 0, w: 1, h: 2 };
const b: GridCell = { id: 'b', x: 2, y: 0, w: 2, h: 1 };
const cells = [a, b];

describe('a grid of cells', () => {
  it('fits a cell inside the grid and clear of the others', () => {
    expect(fits(cells, { id: 'c', x: 1, y: 0, w: 1, h: 3 }, size)).toBe(true);
    expect(fits(cells, { id: 'c', x: 1, y: 0, w: 2, h: 1 }, size)).toBe(false);
    expect(fits(cells, { id: 'c', x: 3, y: 2, w: 2, h: 1 }, size)).toBe(false);
    expect(fits(cells, { ...a, h: 3 }, size)).toBe(true);
  });

  it('knows what covers a position and what is free', () => {
    expect(cellAt(cells, 0, 1)?.id).toBe('a');
    expect(cellAt(cells, 1, 1)).toBeUndefined();
    expect(freePositions(cells, size)).toHaveLength(12 - 2 - 2);
  });

  it('places a cell at its size, shrunk to what fits, or not at all', () => {
    expect(place(cells, { id: 'c', x: 1, y: 0, w: 1, h: 2 }, size)?.at(-1)).toEqual({ id: 'c', x: 1, y: 0, w: 1, h: 2 });
    expect(place(cells, { id: 'c', x: 1, y: 0, w: 3, h: 1 }, size)?.at(-1)).toEqual({ id: 'c', x: 1, y: 0, w: 1, h: 1 });
    expect(place(cells, { id: 'c', x: 0, y: 1, w: 1, h: 1 }, size)).toBeUndefined();
  });

  it('moves a cell along its way, stopping before another', () => {
    expect(moveTo(cells, 'a', 1, 0, size).find((c) => c.id === 'a')).toMatchObject({ x: 1, y: 0 });
    // Toward b's place: it stops at the last free column.
    expect(moveTo(cells, 'a', 3, 0, size).find((c) => c.id === 'a')).toMatchObject({ x: 1, y: 0 });
    expect(moveTo(cells, 'a', 0, 0, size)).toBe(cells);
    expect(moveTo(cells, 'a', -1, 0, size)).toBe(cells);
  });

  it('resizes into free cells only, never below 1 × 1', () => {
    expect(resizeTo(cells, 'a', 2, 3, size).find((c) => c.id === 'a')).toMatchObject({ w: 2, h: 3 });
    expect(resizeTo(cells, 'a', 4, 1, size).find((c) => c.id === 'a')).toMatchObject({ w: 2, h: 1 });
    expect(resizeTo(cells, 'a', 0, 0, size).find((c) => c.id === 'a')).toMatchObject({ w: 1, h: 1 });
  });

  it('marks a cell a smaller grid cuts, and removes by id', () => {
    expect(clipped(b, { columns: 3, rows: 3 })).toBe(true);
    expect(clipped(b, size)).toBe(false);
    expect(removeCell(cells, 'a')).toEqual([b]);
    expect(removeCell(cells, 'z')).toBe(cells);
  });
});
