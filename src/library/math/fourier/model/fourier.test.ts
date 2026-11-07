import { describe, expect, it } from 'vitest';
import { abs, add, arg, cis, mul, polar, turn, C } from './complex';
import { chain, coefficient, decayRate, evaluate, heatMode, heatSum, leibnizPartial, PATHS, samplePath, series, step, stepCoefficient, stepPartial, bySize } from './fourier';

const near = (a: number, b: number, eps = 1e-9) => expect(Math.abs(a - b)).toBeLessThan(eps);

describe('complex', () => {
  it('multiplies by rotating and scaling', () => {
    const z = mul(polar(2, Math.PI / 4), polar(3, Math.PI / 4));
    near(abs(z), 6);
    near(arg(z), Math.PI / 2);
    near(cis(Math.PI).re, -1);
  });
  it('turn(n, t) goes round n times as t goes 0 to 1', () => {
    near(turn(3, 1 / 6).re, Math.cos(Math.PI));
    near(turn(-1, 0.25).im, -1);
    near(turn(0, 0.7).re, 1);
  });
});

describe('coefficients', () => {
  it('finds an ellipse exactly from its two arrows: c₁ and c₋₁, nothing else', () => {
    const samples = samplePath(PATHS.ellipse, 256);
    near(coefficient(samples, 1).re, 0.8, 1e-9);
    near(coefficient(samples, -1).re, 0.2, 1e-9);
    near(abs(coefficient(samples, 0)), 0, 1e-9);
    near(abs(coefficient(samples, 2)), 0, 1e-9);
    near(abs(coefficient(samples, -3)), 0, 1e-9);
  });
  it('c₀ is the centre of the drawing', () => {
    const shifted = samplePath((t) => add(PATHS.ellipse(t), C(2, -1)), 128);
    const c0 = coefficient(shifted, 0);
    near(c0.re, 2);
    near(c0.im, -1);
  });
  it('a real drawing has conjugate pairs: c₋ₙ is the mirror of cₙ', () => {
    const samples = samplePath(PATHS.step, 1024);
    for (const n of [1, 3, 5]) {
      const a = coefficient(samples, n);
      const b = coefficient(samples, -n);
      near(a.re, b.re, 1e-6);
      near(a.im, -b.im, 1e-6);
    }
    // The even ones vanish against the step, to within one sample's worth (the jump lands on a sample).
    expect(abs(coefficient(samples, 2))).toBeLessThan(2 / 1024);
  });
  it('the chain ends where evaluate says, and more terms trace the drawing more closely', () => {
    const samples = samplePath(PATHS.square, 512);
    const terms = series(samples, 10);
    expect(terms.map((t) => t.n).slice(0, 5)).toEqual([0, 1, -1, 2, -2]);
    const joints = chain(terms, 0.3);
    expect(joints).toHaveLength(terms.length + 1);
    const end = joints[joints.length - 1];
    const z = evaluate(terms, 0.3);
    near(end.re, z.re);
    near(end.im, z.im);
    const err = (count: number) => {
      const s = series(samples, count);
      let worst = 0;
      for (let i = 0; i < 100; i++) {
        const t = i / 100;
        const d = abs(add(evaluate(s, t), mul(PATHS.square(t), C(-1))));
        worst = Math.max(worst, d);
      }
      return worst;
    };
    expect(err(20)).toBeLessThan(err(3));
    expect(Math.abs(bySize(terms)[0].n)).toBe(1); // the square is one big turn, whichever way it is traced
  });
});

describe('the step', () => {
  it('has the coefficients 4/π · (1, −⅓, ⅕, …) on the odd cosines', () => {
    near(stepCoefficient(0), 4 / Math.PI);
    near(stepCoefficient(1), -4 / (3 * Math.PI));
    near(stepCoefficient(2), 4 / (5 * Math.PI));
  });
  it('closes in on 1 left of the jump, −1 right of it, and is 0 at it', () => {
    expect(Math.abs(stepPartial(0.25, 200) - 1)).toBeLessThan(0.01);
    expect(Math.abs(stepPartial(0.75, 200) + 1)).toBeLessThan(0.01);
    near(stepPartial(0.5, 50), 0);
    expect([step(0.2), step(0.5), step(0.8)]).toEqual([1, 0, -1]);
  });
  it('1 − ⅓ + ⅕ − … closes in on π/4', () => {
    expect(Math.abs(leibnizPartial(1000) - Math.PI / 4)).toBeLessThan(1e-3);
    expect(Math.abs(leibnizPartial(10) - Math.PI / 4)).toBeGreaterThan(Math.abs(leibnizPartial(1000) - Math.PI / 4));
  });
});

describe('heat', () => {
  it('keeps each mode’s shape and decays its height, faster by n²', () => {
    near(heatMode(0.3, 2, 0), Math.cos(2 * Math.PI * 0.3));
    near(heatMode(0, 1, 0.1) / heatMode(0, 1, 0), Math.exp(-decayRate(1) * 0.1));
    expect(decayRate(2)).toBeCloseTo(4 * decayRate(1));
    near(heatMode(0.4, 0, 100), 1); // the constant never cools
  });
  it('adds modes: a sum of solutions is a solution', () => {
    near(heatSum(0.2, [0.5, 1, 0, 0.25], 0.05), 0.5 + heatMode(0.2, 1, 0.05) + 0.25 * heatMode(0.2, 3, 0.05));
  });
});
