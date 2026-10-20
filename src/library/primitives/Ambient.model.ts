// Ambient light: the colour maths behind the Ambient primitive, pure and allocation-free per
// sample. Pixels are averaged in linear light (the physics of light from a screen), each region's
// mean is turned into OKLab, and the colours ease in OKLab (perceptually even steps).
import { AMBIENT_REGIONS } from '../contract';
import { h, slot, type Node } from '../view/Tree.model';

/** Ambient's element: `lib-ambient` plus the caller's class, holding its children (the `children`
 *  slot). The `--ambient-*` variables are written on it by the sampler, not drawn. */
export const ambientView = (className?: string): Node => h('div', { class: `lib-ambient${className ? ` ${className}` : ''}` }, slot('children'));

/** The regions, in buffer order: `out[i * 3 + 0..2]` is region `i`'s OKLab L, a, b. */
export const REGIONS = AMBIENT_REGIONS;
export const REGION_COUNT = REGIONS.length;

/** What `sampleRegions` reads: an ImageData, or anything shaped like one. */
export interface Pixels {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

/** An OKLab buffer for every region (L, a, b each). */
export const regionBuffer = () => new Float32Array(REGION_COUNT * 3);
/** Scratch for `sampleRegions`: linear r, g, b and weight per region. */
export const scratchBuffer = () => new Float64Array(REGION_COUNT * 4);

/** sRGB byte to linear light, once. */
const LINEAR = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Linear sRGB to OKLab (Ottosson), written at `out[o..o+2]`. */
export function linearToOklab(r: number, g: number, b: number, out: Float32Array, o: number) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  out[o] = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  out[o + 1] = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  out[o + 2] = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
}

/**
 * Averages the picture into each region's colour, in OKLab, into `out`. Regions: `avg` the whole
 * picture, `left` / `right` the outer quarter at each side, `top` / `bottom` the outer third,
 * `centre` the middle half across and third down. A pixel weighs by its alpha. A region with no
 * opaque pixel keeps its previous colour in `out`. Returns false if the picture had none at all.
 */
export function sampleRegions(px: Pixels, out: Float32Array, acc: Float64Array): boolean {
  const { data, width: w, height: h } = px;
  acc.fill(0);
  for (let y = 0; y < h; y++) {
    const fy = (y + 0.5) / h;
    const top = fy < 1 / 3;
    const bottom = fy >= 2 / 3;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3] / 255;
      if (a === 0) continue;
      const r = LINEAR[data[i]] * a;
      const g = LINEAR[data[i + 1]] * a;
      const b = LINEAR[data[i + 2]] * a;
      const fx = (x + 0.5) / w;
      add(acc, 0, r, g, b, a);
      if (fx < 0.25) add(acc, 1, r, g, b, a);
      if (fx >= 0.75) add(acc, 2, r, g, b, a);
      if (top) add(acc, 3, r, g, b, a);
      if (bottom) add(acc, 4, r, g, b, a);
      if (!top && !bottom && fx >= 0.25 && fx < 0.75) add(acc, 5, r, g, b, a);
    }
  }
  for (let k = 0; k < REGION_COUNT; k++) {
    const wt = acc[k * 4 + 3];
    if (wt > 0) linearToOklab(acc[k * 4] / wt, acc[k * 4 + 1] / wt, acc[k * 4 + 2] / wt, out, k * 3);
  }
  return acc[3] > 0;
}

function add(acc: Float64Array, k: number, r: number, g: number, b: number, a: number) {
  const o = k * 4;
  acc[o] += r;
  acc[o + 1] += g;
  acc[o + 2] += b;
  acc[o + 3] += a;
}

/** The share of the way to its target an exponential ease covers in `dtMs` with time constant `tauMs` (0 when frozen: `tauMs` infinite). */
export function easeFactor(dtMs: number, tauMs: number): number {
  if (!(tauMs > 0)) return 1;
  if (!Number.isFinite(tauMs) || dtMs <= 0) return 0;
  return 1 - Math.exp(-dtMs / tauMs);
}

/** One smoothing step: moves `current` toward `target` by `k` (from `easeFactor`), in place. Returns the largest change. */
export function smoothToward(current: Float32Array, target: Float32Array, k: number): number {
  let most = 0;
  for (let i = 0; i < current.length; i++) {
    const d = (target[i] - current[i]) * k;
    current[i] += d;
    if (Math.abs(d) > most) most = Math.abs(d);
  }
  return most;
}

/** Region `k`'s colour as CSS: `oklab(L a b)`, L clamped to 0–1. */
export function oklabCss(buf: Float32Array, k: number): string {
  const L = Math.min(1, Math.max(0, buf[k * 3]));
  return `oklab(${L.toFixed(3)} ${buf[k * 3 + 1].toFixed(4)} ${buf[k * 3 + 2].toFixed(4)})`;
}
