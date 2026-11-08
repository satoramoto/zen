// Fields from many prime waves at once: the radial profile (the rings), the box field (the 2D
// picture), and meshes for a plane and a sphere. Pure; cached per input.
import type { TriangleMesh } from '../../lab/geometry';

/**
 * H(s) = (1/N)·Σ w(p)·cos(2π·p·s) at s = i·step for i = 0…count−1, over the given primes (w = 1
 * unless `weight` is given). Each prime's
 * term is a phasor turned by the same angle each step, so no trig call per sample: N·count
 * multiply-adds, renormalised every 256 steps so rounding never builds up.
 */
export function cosineProfile(primes: ArrayLike<number>, step: number, count: number, weight?: (p: number) => number): Float64Array {
  const out = new Float64Array(count);
  const n = primes.length;
  if (n === 0 || count === 0) return out;
  for (let k = 0; k < n; k++) {
    const a = 2 * Math.PI * primes[k] * step;
    const cr = Math.cos(a);
    const ci = Math.sin(a);
    const w = weight ? weight(primes[k]) : 1;
    if (w === 0) continue;
    let zr = 1;
    let zi = 0;
    for (let i = 0; i < count; i++) {
      out[i] += w * zr;
      const r = zr * cr - zi * ci;
      zi = zr * ci + zi * cr;
      zr = r;
      if ((i & 255) === 255) {
        // Back onto the unit circle.
        const m = Math.hypot(zr, zi);
        zr /= m;
        zi /= m;
      }
    }
  }
  for (let i = 0; i < count; i++) out[i] /= n;
  return out;
}

const cache = new Map<string, Float64Array>();
const remember = (key: string, make: () => Float64Array) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const value = make();
  if (cache.size > 24) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
  return value;
};

/** sin(πx)/(πx), 1 at 0. */
export const sinc = (x: number) => (Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));

/**
 * The rings as a pixel of radial width `width` sees them: the mean of cos(2π·p·r) over the pixel
 * is cos(2π·p·r)·sinc(p·width), so a wave much finer than the pixel averages away.
 */
export function averagedRadialProfile(primes: Int32Array, step: number, bins: number): Float64Array {
  return remember(`a:${primes.length}:${step}:${bins}`, () => cosineProfile(primes, step, bins, (p) => sinc(p * step)));
}

/**
 * The rings: the profile F(r) = (1/N)·Σ cos(2π·p·r) at `bins` radii from 0 to `extent`. It is 1 at
 * whole numbers (every term is 1) and −1 + 2/N at halves (every odd prime gives −1, the prime 2
 * gives +1).
 */
export function radialProfile(primes: Int32Array, extent: number, bins: number): Float64Array {
  return remember(`r:${primes.length}:${extent}:${bins}`, () => cosineProfile(primes, extent / Math.max(1, bins - 1), bins));
}

/**
 * The box field G(x, y) = (1/N)·Σ cos(2π·p·x)·cos(2π·p·y) on an R × R grid over [0, 1]², row by
 * row. Since cos a·cos b = ½(cos(a + b) + cos(a − b)), G is ½(H(x + y) + H(x − y)) for the 1D
 * profile H, so the grid costs one profile of 2R − 1 points and a lookup per cell.
 */
export function boxField(primes: Int32Array, resolution: number): Float64Array {
  return remember(`b:${primes.length}:${resolution}`, () => {
    const R = resolution;
    const h = cosineProfile(primes, 1 / Math.max(1, R - 1), 2 * R - 1);
    const out = new Float64Array(R * R);
    for (let i = 0; i < R; i++) for (let j = 0; j < R; j++) out[i * R + j] = 0.5 * (h[i + j] + h[Math.abs(i - j)]);
    return out;
  });
}

/** A colour for a value in [−1, 1]: the ramp between `low` and `high` (RGB, 0–1), through `mid` at 0. */
export type Ramp = { low: [number, number, number]; mid: [number, number, number]; high: [number, number, number] };

export function rampAt(ramp: Ramp, v: number): [number, number, number] {
  const t = Math.max(-1, Math.min(1, v));
  const [a, b, u] = t < 0 ? [ramp.mid, ramp.low, -t] : [ramp.mid, ramp.high, t];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

/** The largest |value| in a field, for scaling a ramp so its features show (at least `floor`). */
export function spread(field: ArrayLike<number>, floor = 1e-6): number {
  let m = floor;
  for (let i = 0; i < field.length; i++) m = Math.max(m, Math.abs(field[i]));
  return m;
}

/**
 * The box field as a height surface over [−1, 1]², `rotation` (radians) about the vertical axis:
 * z from the value times `height`, colour from the ramp.
 */
export function planeMesh(field: Float64Array, R: number, ramp: Ramp, height = 0.6, rotation = 0): TriangleMesh {
  const s = spread(field);
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const [c, sn] = [Math.cos(rotation), Math.sin(rotation)];
  for (let i = 0; i < R; i++)
    for (let j = 0; j < R; j++) {
      const x = (j / (R - 1)) * 2 - 1;
      const y = (i / (R - 1)) * 2 - 1;
      const v = field[i * R + j] / s;
      // three.js is y-up: the field lies in x–z, its value is the height.
      positions.push(x * c - y * sn, v * height, x * sn + y * c);
      colors.push(...rampAt(ramp, v));
    }
  for (let i = 0; i < R - 1; i++)
    for (let j = 0; j < R - 1; j++) {
      const a = i * R + j;
      indices.push(a, a + 1, a + R, a + 1, a + R + 1, a + R);
    }
  return { positions, indices, colors };
}

/**
 * The same values on a sphere: x round the equator (longitude), y from pole to pole (latitude),
 * radius 1 + `bump`·value, colour from the ramp; `rotation` turns it about the polar axis and
 * `tilt` towards the viewer.
 */
export function sphereMesh(field: Float64Array, R: number, ramp: Ramp, bump = 0.06, rotation = 0, tilt = 0): TriangleMesh {
  const s = spread(field);
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const [ct, st] = [Math.cos(tilt), Math.sin(tilt)];
  for (let i = 0; i < R; i++)
    for (let j = 0; j < R; j++) {
      const lon = (j / (R - 1)) * 2 * Math.PI + rotation;
      const lat = (i / (R - 1)) * Math.PI - Math.PI / 2;
      const v = field[i * R + j] / s;
      const r = 1 + bump * v;
      const x = r * Math.cos(lat) * Math.cos(lon);
      const y = r * Math.sin(lat);
      const z = r * Math.cos(lat) * Math.sin(lon);
      positions.push(x, y * ct - z * st, y * st + z * ct);
      colors.push(...rampAt(ramp, v));
    }
  for (let i = 0; i < R - 1; i++)
    for (let j = 0; j < R - 1; j++) {
      const a = i * R + j;
      indices.push(a, a + 1, a + R, a + 1, a + R + 1, a + R);
    }
  return { positions, indices, colors };
}
