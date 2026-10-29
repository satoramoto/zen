import { cellsIn, levelFor, type Chosen, type Steps } from './levels';

/** The source outline, unchanged: cell-centred extrema, Catmull-Rom edges, a one-pixel floor. */
export interface Edges {
  topX: Float32Array;
  topY: Float32Array;
  lowX: Float32Array;
  lowY: Float32Array;
  points: number;
  level: number;
  read: number;
}
export interface Shape { path: Path2D; points: number; level: number; read: number }
export interface OutlineAsk {
  from: number;
  to: number;
  width: number;
  height: number;
  density: number;
  smooth: number;
  headroom: number;
  thinnest?: number;
}

const apart = (top: Float32Array, low: Float32Array, count: number, least: number): void => {
  for (let i = 0; i < count; i++) {
    if (low[i] - top[i] >= least) continue;
    const middle = (top[i] + low[i]) / 2;
    top[i] = middle - least / 2;
    low[i] = middle + least / 2;
  }
};

export function densityFor(share: number): number {
  if (!(share > 0)) return 2;
  return Math.min(2, Math.max(0.25, 0.25 * Math.pow(1 / share, 0.45)));
}
export function edgeInk(density: number): number {
  if (!(density > 0)) return 0.9;
  return Math.min(0.9, Math.max(0.3, 0.45 / Math.sqrt(density)));
}

/** Tangents pass through the measured peaks; zero smoothness collapses to the polyline. */
const through = (path: Path2D, xs: Float32Array, ys: Float32Array, count: number, smooth: number): void => {
  for (let i = 0; i < count - 1; i++) {
    const x0 = xs[i > 0 ? i - 1 : 0], y0 = ys[i > 0 ? i - 1 : 0];
    const x1 = xs[i], y1 = ys[i], x2 = xs[i + 1], y2 = ys[i + 1];
    const x3 = xs[i + 2 < count ? i + 2 : count - 1], y3 = ys[i + 2 < count ? i + 2 : count - 1];
    const k = smooth / 6;
    path.bezierCurveTo(x1 + (x2 - x0) * k, y1 + (y2 - y0) * k, x2 - (x3 - x1) * k, y2 - (y3 - y1) * k, x2, y2);
  }
};

export function edgesOf(levels: readonly Steps[], ask: OutlineAsk): Edges {
  const { from, to, width, height, density, headroom } = ask;
  const wanted = Math.max(2, Math.round(width * density));
  const chosen: Chosen = levelFor(levels, from, to, wanted);
  const { steps } = chosen;
  const span = Math.max(1, chosen.to - chosen.from);
  const count = Math.min(wanted, span);
  const cells = cellsIn(steps);
  const middle = height / 2, reach = middle * headroom;
  const topX = new Float32Array(count), topY = new Float32Array(count);
  const lowX = new Float32Array(count), lowY = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = chosen.from + Math.floor((i * span) / count);
    const b = Math.max(a + 1, chosen.from + Math.floor(((i + 1) * span) / count));
    let low = 0, high = 0;
    for (let c = a; c < b; c++) {
      const min = steps[c * 2], max = steps[c * 2 + 1];
      if (min < low) low = min;
      if (max > high) high = max;
    }
    const at = ((a + b) / 2 / cells - from) / (to - from);
    topX[i] = lowX[i] = at * width;
    topY[i] = middle - high * reach;
    lowY[i] = middle - low * reach;
  }
  apart(topY, lowY, count, ask.thinnest ?? 1);
  return { topX, topY, lowX, lowY, points: count, level: chosen.level, read: span };
}

/** Below the summary's resolution, fold actual channels by widest excursion. */
export function samplesFrom(channels: readonly Float32Array[], ask: OutlineAsk & { length: number }): Edges {
  const { from, to, width, height, density, headroom, length } = ask;
  const first = Math.max(0, Math.floor(from * length)), last = Math.min(length, Math.ceil(to * length));
  const span = Math.max(1, last - first);
  const count = Math.max(2, Math.min(Math.round(width * density), span));
  const middle = height / 2, reach = middle * headroom;
  const topX = new Float32Array(count), topY = new Float32Array(count);
  const lowX = new Float32Array(count), lowY = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = first + Math.floor((i * span) / count);
    const b = Math.max(a + 1, first + Math.floor(((i + 1) * span) / count));
    let low = 0, high = 0;
    for (const channel of channels) {
      for (let sample = a; sample < b; sample++) {
        const value = channel[sample];
        if (value < low) low = value;
        else if (value > high) high = value;
      }
    }
    const at = ((a + b) / 2 / length - from) / (to - from);
    topX[i] = lowX[i] = at * width;
    topY[i] = middle - high * reach;
    lowY[i] = middle - low * reach;
  }
  apart(topY, lowY, count, ask.thinnest ?? 1);
  return { topX, topY, lowX, lowY, points: count, level: -1, read: span };
}

export function pathOf(edges: Edges, smooth: number): Path2D {
  const { topX, topY, lowX, lowY, points } = edges;
  const path = new Path2D();
  if (!points) return path;
  path.moveTo(topX[0], topY[0]);
  through(path, topX, topY, points, smooth);
  path.lineTo(lowX[points - 1], lowY[points - 1]);
  const backX = new Float32Array(points), backY = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    backX[i] = lowX[points - 1 - i];
    backY[i] = lowY[points - 1 - i];
  }
  through(path, backX, backY, points, smooth);
  path.closePath();
  return path;
}
export function outlineOf(levels: readonly Steps[], ask: OutlineAsk): Shape {
  const edges = edgesOf(levels, ask);
  return { path: pathOf(edges, ask.smooth), points: edges.points, level: edges.level, read: edges.read };
}
