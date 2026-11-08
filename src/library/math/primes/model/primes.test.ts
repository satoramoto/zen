import { describe, expect, it } from 'vitest';
import { boxField, cosineProfile, planeMesh, radialProfile, rampAt, sphereMesh, type Ramp } from './fields';
import { clampCount, firstPrimes, gaps, histogram, isPrime, MAX_PRIMES } from './primes';
import { columnsOf, fft, gapTones, indicator, indicatorAt, magnitude, peaks, simpleFraction } from './spectrum';
import { boundaryWave, closestApproach, nodeMarks, wrappedRadius } from './waves';

describe('primes', () => {
  it('sieves the first 100,000', () => {
    expect(Array.from(firstPrimes(10))).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    expect(firstPrimes(10_000)[9_999]).toBe(104_729);
    expect(firstPrimes(MAX_PRIMES)[MAX_PRIMES - 1]).toBe(1_299_709);
    expect(firstPrimes(MAX_PRIMES + 50)).toHaveLength(MAX_PRIMES);
    expect(isPrime(104_729)).toBe(true);
    expect(isPrime(104_730)).toBe(false);
  });
  it('finds 6 the commonest gap among the first 10,000', () => {
    const h = histogram(gaps(firstPrimes(10_000)));
    const [value, count] = [...h].sort((a, b) => b[1] - a[1])[0];
    expect(value).toBe(6);
    expect(count).toBe(2012);
    expect(h[0]).toEqual([1, 1]);
    expect(h.slice(1).every(([g]) => g % 2 === 0)).toBe(true);
  });
  it('clamps a request and says so', () => {
    expect(clampCount(500_000, 100_000)).toEqual({ count: 100_000, clamped: true });
    expect(clampCount(12.4, 60)).toEqual({ count: 12, clamped: false });
  });
});

describe('waves in a boundary', () => {
  it('has p half-waves and p − 1 interior nodes', () => {
    expect(boundaryWave(5, 0)).toBeCloseTo(0, 12);
    expect(boundaryWave(5, 1)).toBeCloseTo(0, 12);
    expect(boundaryWave(5, 0.1)).toBeCloseTo(1, 12);
    expect(nodeMarks(5)).toEqual([0.2, 0.4, 0.6, 0.8]);
  });
  it('never lets two primes’ marks meet, and the closest pair is the two largest', () => {
    const ps = Array.from(firstPrimes(60));
    let best = Infinity;
    for (let a = 0; a < 25; a++)
      for (let b = a + 1; b < 25; b++)
        for (const x of nodeMarks(ps[a]))
          for (const y of nodeMarks(ps[b])) {
            expect(Math.abs(x - y)).toBeGreaterThan(1e-12);
            best = Math.min(best, Math.abs(x - y));
          }
    expect(best).toBeCloseTo(closestApproach(ps.slice(0, 25))!.distance, 12);
    const c = closestApproach([5, 7, 11, 13])!;
    expect(c).toMatchObject({ p: 11, q: 13 });
    expect(c.distance).toBeCloseTo(1 / 143, 15);
    expect(Math.abs(c.k / c.p - c.j / c.q)).toBeCloseTo(1 / 143, 15);
    expect(closestApproach(ps.slice(0, 12))!.distance).toBeLessThan(1 / 1000);
    expect(closestApproach(ps.slice(0, 11))!.distance).toBeGreaterThan(1 / 1000);
  });
  it('wraps a wave round a circle', () => {
    expect(wrappedRadius(5, Math.PI / 10, 0.1)).toBeCloseTo(1.1, 12);
  });
});

describe('fields', () => {
  it('sums phasors to the same values as cosines', () => {
    const ps = firstPrimes(50);
    const fast = cosineProfile(ps, 0.0137, 2000);
    for (const i of [0, 1, 777, 1999]) {
      let s = 0;
      for (const p of ps) s += Math.cos(2 * Math.PI * p * 0.0137 * i);
      expect(fast[i]).toBeCloseTo(s / ps.length, 9);
    }
  });
  it('rings: 1 at whole numbers, −1 + 2/N at halves', () => {
    const ps = firstPrimes(20_000);
    const f = radialProfile(ps, 3, 601);
    expect(f[200]).toBeCloseTo(1, 9);
    expect(f[400]).toBeCloseTo(1, 9);
    expect(f[100]).toBeCloseTo(-1 + 2 / ps.length, 9);
    expect(f[300]).toBeCloseTo(-1 + 2 / ps.length, 9);
  });
  it('box field: the product form, and the square’s symmetries', () => {
    const ps = firstPrimes(200);
    const R = 33;
    const g = boxField(ps, R);
    const direct = (x: number, y: number) => {
      let s = 0;
      for (const p of ps) s += Math.cos(2 * Math.PI * p * x) * Math.cos(2 * Math.PI * p * y);
      return s / ps.length;
    };
    expect(g[5 * R + 9]).toBeCloseTo(direct(9 / (R - 1), 5 / (R - 1)), 9);
    for (const [i, j] of [[3, 7], [10, 20], [0, 31]]) {
      expect(g[i * R + j]).toBeCloseTo(g[j * R + i], 12);
      expect(g[i * R + j]).toBeCloseTo(g[(R - 1 - i) * R + j], 9);
      expect(g[i * R + j]).toBeCloseTo(g[i * R + (R - 1 - j)], 9);
    }
  });
  it('builds a plane and a sphere with a colour per vertex', () => {
    const ramp: Ramp = { low: [0, 0, 1], mid: [1, 1, 1], high: [1, 0, 0] };
    expect(rampAt(ramp, 1)).toEqual([1, 0, 0]);
    expect(rampAt(ramp, -0.5)).toEqual([0.5, 0.5, 1]);
    const g = boxField(firstPrimes(30), 17);
    const plane = planeMesh(g, 17, ramp);
    expect(plane.positions).toHaveLength(17 * 17 * 3);
    expect(plane.colors).toHaveLength(17 * 17 * 3);
    expect(plane.indices).toHaveLength(16 * 16 * 6);
    const sphere = sphereMesh(g, 17, ramp);
    const radius = Math.hypot(sphere.positions[30], sphere.positions[31], sphere.positions[32]);
    expect(radius).toBeGreaterThan(0.9);
    expect(radius).toBeLessThan(1.1);
  });
});

describe('spectra', () => {
  it('matches a direct DFT', () => {
    const n = 64;
    const x = Float64Array.from({ length: n }, (_, i) => Math.sin(i * 0.7) + (i % 5) * 0.1);
    const re = Float64Array.from(x);
    const im = new Float64Array(n);
    fft(re, im);
    for (const k of [0, 3, 17, 40]) {
      let r = 0;
      let i = 0;
      for (let t = 0; t < n; t++) {
        r += x[t] * Math.cos((-2 * Math.PI * k * t) / n);
        i += x[t] * Math.sin((-2 * Math.PI * k * t) / n);
      }
      expect(re[k]).toBeCloseTo(r, 9);
      expect(im[k]).toBeCloseTo(i, 9);
    }
    expect(() => fft(new Float64Array(6), new Float64Array(6))).toThrow();
  });
  it('plays the gaps as tones whose spikes are the gap counts', () => {
    const g = gaps(firstPrimes(10_000));
    const { signal, baseBin, segment } = gapTones(g);
    const spectrum = magnitude(signal);
    const top = peaks(spectrum, 3, Math.floor(baseBin / 2));
    // 6 first; gaps of 2 and 4 are near-tied (1,270 and 1,263), so either may come second.
    const order = top.map((p) => Math.round(p.bin / baseBin));
    expect(order[0]).toBe(6);
    expect(order.slice(1).sort()).toEqual([2, 4]);
    // A spike's height is about half a tone's samples times its count.
    const counts = new Map(histogram(g));
    for (const gap of [6, 12, 30]) expect(spectrum[gap * baseBin] / ((segment / 2) * counts.get(gap)!)).toBeGreaterThan(0.9);
    expect(spectrum[6 * baseBin]).toBeGreaterThan(spectrum[12 * baseBin]);
    expect(columnsOf(spectrum, 100)).toHaveLength(100);
  });
  it('finds the indicator’s peaks at simple fractions', () => {
    const L = 1 << 17;
    // Every prime but 2 is odd: exactly 1 − 2/count.
    expect(indicatorAt(L, 1, 2)).toBeCloseTo(1, 3);
    expect(indicatorAt(L, 1, 3)).toBeCloseTo(0.5, 2);
    expect(indicatorAt(L, 1, 6)).toBeCloseTo(0.5, 2);
    expect(indicatorAt(L, 1, 5)).toBeCloseTo(0.25, 1);
    expect(indicatorAt(L, 1, 4)).toBeLessThan(0.02);
    const spectrum = magnitude(indicator(L));
    const named = peaks(spectrum, 3, 50).map((p) => simpleFraction(p.bin / L, 12, 2 / L));
    expect(named).toEqual([{ a: 1, q: 2 }, expect.anything(), expect.anything()]);
    expect(named.slice(1).map((f) => f && f.q).sort()).toEqual([3, 6]);
  });
});
