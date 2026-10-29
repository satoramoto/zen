import { describe, expect, it } from 'vitest';
import { binProjectedPoints, MAX_DISTRIBUTION_BINS, type DistributionPoint } from './distribution';
const camera = { zoom: 1, x: 0, y: 0 };

describe('lossless projected spatial distribution', () => {
  it('conserves every point and every hue without sampling', () => {
    const points = Array.from({ length: 100_000 }, (_, i) => ({ id: String(i), px: i % 1000, py: Math.floor(i / 1000) * 10, hue: i % 4 + 1 }));
    const result = binProjectedPoints(points, camera);
    expect(result.inputCount).toBe(100_000);
    expect(result.visibleCount).toBe(100_000);
    expect(result.culledCount).toBe(0);
    expect(result.invalidCount).toBe(0);
    expect(result.bins.reduce((sum, b) => sum + b.count, 0)).toBe(100_000);
    for (const bin of result.bins) {
      expect(bin.hues.reduce((sum, hue) => sum + hue.count, 0)).toBe(bin.count);
      expect(bin.hues.reduce((sum, hue) => sum + hue.proportion, 0)).toBeCloseTo(1);
      expect(bin.hues.every(hue => hue.total === bin.count)).toBe(true);
    }
  });
  it('applies the centered camera before culling and keeps exact edge centers', () => {
    const points = [0, 250, 500, 750, 1000].map(n => ({ id: String(n), px: n, py: 500 }));
    const result = binProjectedPoints(points, { zoom: 2, x: 0, y: 0 });
    expect(result.visibleCount).toBe(3);
    expect(result.culledCount).toBe(2);
    expect(result.bins.map(b => b.representativeId)).toEqual(['250', '500', '750']);
    expect(result.bins[0]!.centroid.x).toBe(0);
    expect(result.bins.at(-1)!.centroid.x).toBe(1000);
    const panned = binProjectedPoints(points, { zoom: 2, x: 1, y: 0 });
    expect(panned.visibleCount).toBe(2);
    expect(panned.culledCount).toBe(3);
  });
  it('bounds cell count and rectangles even for a tiny requested cell', () => {
    const points = Array.from({ length: 10_201 }, (_, i) => ({ id: String(i), px: i % 101 * 10, py: Math.floor(i / 101) * 10 }));
    const result = binProjectedPoints(points, camera, { binSize: 0.001 });
    expect(result.columns).toBe(44);
    expect(result.bins.length).toBeLessThanOrEqual(MAX_DISTRIBUTION_BINS);
    expect(result.visibleCount).toBe(points.length);
    for (const bin of result.bins) {
      expect(bin.width).toBeGreaterThan(0);
      expect(bin.height).toBeGreaterThan(0);
      expect(bin.x).toBeGreaterThanOrEqual(0);
      expect(bin.y).toBeGreaterThanOrEqual(0);
      expect(bin.x + bin.width).toBeLessThanOrEqual(1000);
      expect(bin.y + bin.height).toBeLessThanOrEqual(1000);
    }
  });
  it('counts transparent and mixed-hue populations independently of opacity', () => {
    const points: DistributionPoint[] = [
      { id: 'A', px: 1, py: 1, hue: 1, opacity: 0 },
      { id: 'B', px: 12, py: 12, hue: 1, opacity: 0.5 },
      { id: 'C', px: 20, py: 20, hue: 2, opacity: 1 },
      { id: 'D', px: 4, py: 4 },
    ];
    const bin = binProjectedPoints(points, camera).bins[0]!;
    expect(bin.count).toBe(4);
    expect(bin.hues).toEqual([{ hue: 1, count: 2, proportion: 0.5, total: 4 }, { hue: 2, count: 1, proportion: 0.25, total: 4 }, { hue: null, count: 1, proportion: 0.25, total: 4 }]);
    expect(bin.meanOpacity).toBe(0.625);
    expect(bin.centroid).toEqual({ x: 9.25, y: 9.25 });
    expect(bin.representativeId).toBe('B');
    expect(bin.numericIdCount).toBe(0);
    expect(bin.minNumericId).toBeUndefined();
  });
  it('preserves numeric ID extrema beyond the safe integer range', () => {
    const ids = ['9007199254740993', '9007199254740992', '-9007199254740995', '-2', '007', 'object:9'];
    const points = ids.map(id => ({ id, px: 12, py: 12 }));
    const bin = binProjectedPoints(points, camera).bins[0]!;
    expect(bin.minNumericId).toBe('-9007199254740995');
    expect(bin.maxNumericId).toBe('9007199254740993');
    expect(bin.numericIdCount).toBe(5);
    const fast = binProjectedPoints(points, camera, { numericIds: false }).bins[0]!;
    expect(fast.numericIdCount).toBe(0);
    expect(fast.minNumericId).toBeUndefined();
    expect(fast.count).toBe(6);
  });
  it('distinguishes invalid points from finite offscreen points', () => {
    const points = [{ id: '1', px: NaN, py: 0 }, { id: '2', px: 10, py: Infinity }, { id: '3', px: -1, py: 0 }, { id: '4', px: 1000, py: 1000 }];
    const result = binProjectedPoints(points, camera);
    expect(result.invalidCount).toBe(2);
    expect(result.culledCount).toBe(1);
    expect(result.visibleCount).toBe(1);
    expect(result.inputCount).toBe(result.invalidCount + result.culledCount + result.visibleCount);
  });
  it('handles empty input and oversized bins and rejects invalid camera/bin settings', () => {
    expect(binProjectedPoints([], camera).bins).toEqual([]);
    const single = binProjectedPoints([{ id: '1', px: 1000, py: 1000 }], camera, { binSize: 2000 });
    expect(single.columns).toBe(1);
    expect(single.bins[0]).toMatchObject({ width: 1000, height: 1000, count: 1 });
    for (const binSize of [0, -1, NaN, Infinity]) expect(() => binProjectedPoints([], camera, { binSize })).toThrow(RangeError);
    for (const bad of [{ zoom: 0, x: 0, y: 0 }, { zoom: 1, x: Infinity, y: 0 }]) expect(() => binProjectedPoints([], bad)).toThrow(RangeError);
  });
});
