/** Lossless aggregation of projected point centers into a bounded, screen-space grid.
 * This computes counts, not a sample: opacity never removes a point from the population.
 * The caller supplies the mathematical subset intended for display. */
export const DISTRIBUTION_EXTENT = 1000;
export const MAX_DISTRIBUTION_COLUMNS = 44;
export const MAX_DISTRIBUTION_BINS = MAX_DISTRIBUTION_COLUMNS ** 2;
export interface DistributionPoint {
  id: string;
  px: number;
  py: number;
  hue?: number;
  opacity?: number;
}
export interface DistributionCamera { zoom: number; x: number; y: number }
export interface SpatialBinOptions {
  /** Drawing-plane units, not CSS pixels. Values below 1000/44 are raised to that bound. */
  binSize?: number;
  /** Disable optional decimal-ID extrema for frame-by-frame navigation. Defaults to true. */
  numericIds?: boolean;
}
export interface BinHue {
  hue: number | null;
  count: number;
  /** This floating-point ratio has exact integer numerator `count` and denominator `total`. */
  proportion: number;
  total: number;
}
export interface SpatialBin {
  id: string;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  count: number;
  hues: BinHue[];
  centroid: { x: number; y: number };
  /** Original identity nearest the bin center; ties preserve input order. */
  representativeId: string;
  meanOpacity: number;
  /** Canonical exact decimal IDs. Non-decimal identities are excluded from extrema only. */
  minNumericId?: string;
  maxNumericId?: string;
  numericIdCount: number;
}
export interface SpatialDistribution {
  bins: SpatialBin[];
  inputCount: number;
  visibleCount: number;
  /** Finite points whose transformed centers fall outside the inclusive viewport. */
  culledCount: number;
  /** Non-finite source positions or transformed positions. */
  invalidCount: number;
  binSize: number;
  columns: number;
}
interface Accumulator {
  column: number; row: number; x: number; y: number; width: number; height: number;
  count: number; hues: Map<number | null, number>; sumX: number; sumY: number;
  representativeId: string; representativeDistance: number; sumOpacity: number;
  min?: number | bigint; max?: number | bigint; numericIdCount: number;
}
const decimalId = /^-?\d+$/;
function numericIdentity(id: string): number | bigint | undefined {
  if (!decimalId.test(id)) return undefined;
  const value = Number(id);
  return Number.isSafeInteger(value) ? value : BigInt(id);
}
/**
 * Apply the viewport's centered camera transform, cull offscreen centers, and aggregate
 * every remaining point once. Bins are returned in row-major order; at most 1936 exist.
 * A center exactly on x=1000 or y=1000 belongs to the last cell. Marks crossing an edge
 * whose centers lie outside are excluded, so the count definition remains unambiguous.
 */
export function binProjectedPoints(
  points: readonly DistributionPoint[],
  camera: DistributionCamera,
  options: SpatialBinOptions = {},
): SpatialDistribution {
  if (!Number.isFinite(camera.zoom) || camera.zoom <= 0 || !Number.isFinite(camera.x) || !Number.isFinite(camera.y)) throw new RangeError('Use a finite camera with positive zoom.');
  const requested = options.binSize ?? 24;
  if (!Number.isFinite(requested) || requested <= 0) throw new RangeError('Bin size must be finite and positive.');
  const binSize = Math.max(DISTRIBUTION_EXTENT / MAX_DISTRIBUTION_COLUMNS, requested);
  const columns = Math.ceil(DISTRIBUTION_EXTENT / binSize);
  const cells: (Accumulator | undefined)[] = new Array(columns * columns);
  const includeNumeric = options.numericIds !== false;
  let visibleCount = 0, culledCount = 0, invalidCount = 0;
  for (const point of points) {
    const x = 500 + (point.px - 500) * camera.zoom + camera.x;
    const y = 500 + (point.py - 500) * camera.zoom + camera.y;
    if (!Number.isFinite(point.px) || !Number.isFinite(point.py) || !Number.isFinite(x) || !Number.isFinite(y)) { invalidCount++; continue; }
    if (x < 0 || y < 0 || x > DISTRIBUTION_EXTENT || y > DISTRIBUTION_EXTENT) { culledCount++; continue; }
    visibleCount++;
    const column = Math.min(columns - 1, Math.floor(x / binSize));
    const row = Math.min(columns - 1, Math.floor(y / binSize));
    const index = row * columns + column;
    let bin = cells[index];
    if (!bin) {
      const left = column * binSize, top = row * binSize;
      bin = { column, row, x: left, y: top, width: Math.min(binSize, DISTRIBUTION_EXTENT - left), height: Math.min(binSize, DISTRIBUTION_EXTENT - top), count: 0, hues: new Map(), sumX: 0, sumY: 0, representativeId: point.id, representativeDistance: Infinity, sumOpacity: 0, numericIdCount: 0 };
      cells[index] = bin;
    }
    bin.count++;
    bin.sumX += x; bin.sumY += y;
    const hue = typeof point.hue === 'number' && Number.isFinite(point.hue) ? point.hue : null;
    bin.hues.set(hue, (bin.hues.get(hue) ?? 0) + 1);
    bin.sumOpacity += point.opacity === undefined || !Number.isFinite(point.opacity) ? 1 : Math.max(0, Math.min(1, point.opacity));
    const distance = (x - (bin.x + bin.width / 2)) ** 2 + (y - (bin.y + bin.height / 2)) ** 2;
    if (distance < bin.representativeDistance) { bin.representativeDistance = distance; bin.representativeId = point.id; }
    if (includeNumeric) {
      const numeric = numericIdentity(point.id);
      if (numeric !== undefined) {
        bin.numericIdCount++;
        if (bin.min === undefined || numeric < bin.min) bin.min = numeric;
        if (bin.max === undefined || numeric > bin.max) bin.max = numeric;
      }
    }
  }
  const bins: SpatialBin[] = [];
  for (const bin of cells) if (bin) {
    bins.push({ id: `${bin.column}:${bin.row}`, column: bin.column, row: bin.row, x: bin.x, y: bin.y, width: bin.width, height: bin.height,
      count: bin.count, hues: [...bin.hues].map(([hue, count]) => ({ hue, count, proportion: count / bin.count, total: bin.count })),
      centroid: { x: bin.sumX / bin.count, y: bin.sumY / bin.count }, representativeId: bin.representativeId,
      meanOpacity: bin.sumOpacity / bin.count, numericIdCount: bin.numericIdCount,
      ...(bin.min !== undefined ? { minNumericId: String(bin.min), maxNumericId: String(bin.max) } : {}) });
  }
  return { bins, inputCount: points.length, visibleCount, culledCount, invalidCount, binSize, columns };
}
