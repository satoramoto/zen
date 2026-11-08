import { describe, expect, it } from 'vitest';
import { coterminal, exactText, nearestSpecial, neatPi, normalise, quadrant, radiansTex, radiansText, referenceAngle, signs, toRadians } from './angle';
import { areaFromSine, cosineTerms, placeSAS, rightTriangle, rightTriangleFrom, sineRatios, ssa, triangle } from './triangle';
import { fit, inverseAt, periodFrom, poles, sampleWave, solveOn, waveAt, type Wave } from './wave';

describe('angles', () => {
  it('normalises and finds coterminal angles', () => {
    expect(normalise(-30)).toBe(330);
    expect(normalise(750)).toBe(30);
    expect(coterminal(750)).toEqual({ angle: 30, turns: 2 });
    expect(coterminal(-30)).toEqual({ angle: 330, turns: -1 });
  });
  it('knows the quadrant, the reference angle and the signs', () => {
    expect(quadrant(210)).toBe(3);
    expect(quadrant(90)).toBe(0);
    expect(quadrant(-45)).toBe(4);
    expect(referenceAngle(210)).toBe(30);
    expect(referenceAngle(150)).toBe(30);
    expect(referenceAngle(300)).toBe(60);
    expect(signs(210)).toEqual({ sin: -1, cos: -1, tan: 1 });
    expect(signs(135)).toEqual({ sin: 1, cos: -1, tan: -1 });
    expect(signs(90)).toEqual({ sin: 1, cos: 0, tan: 0 });
  });
  it('writes neat multiples of π', () => {
    expect(neatPi(60)).toEqual({ n: 1, d: 3 });
    expect(neatPi(120)).toEqual({ n: 2, d: 3 });
    expect(neatPi(180)).toEqual({ n: 1, d: 1 });
    expect(neatPi(360)).toEqual({ n: 2, d: 1 });
    expect(neatPi(57)).toBeUndefined();
    expect(radiansText(60)).toBe('π/3');
    expect(radiansText(-90)).toBe('−π/2');
    expect(radiansText(0)).toBe('0');
    expect(radiansText(57.2958)).toBe('1.00 rad');
    expect(radiansTex(150)).toBe('\\frac{5\\pi}{6}');
    expect(radiansTex(180)).toBe('\\pi');
  });
  it('snaps to the nearest special angle', () => {
    expect(nearestSpecial(212)).toEqual({ angle: 210, off: 2 });
    expect(nearestSpecial(358)).toEqual({ angle: 0, off: 2 });
    expect(nearestSpecial(37)).toEqual({ angle: 30, off: 7 });
  });
  it('names exact values', () => {
    expect(exactText(Math.sin(toRadians(30)))).toBe('½');
    expect(exactText(Math.cos(toRadians(150)))).toBe('−√3/2');
    expect(exactText(Math.tan(toRadians(45)))).toBe('1');
    expect(exactText(Math.tan(toRadians(30)))).toBe('√3/3');
    expect(exactText(0.1234)).toBe('0.123');
  });
});

describe('triangles', () => {
  it('solves the right triangle and reads it back from its vertex', () => {
    const t = rightTriangle(30, 2);
    expect(t.opposite).toBeCloseTo(1, 9);
    expect(t.adjacent).toBeCloseTo(Math.sqrt(3), 9);
    expect(t.sin).toBeCloseTo(0.5, 9);
    expect(rightTriangleFrom({ x: Math.sqrt(3), y: 1 })).toMatchObject({ angle: expect.closeTo(30, 9), hypotenuse: expect.closeTo(2, 9) });
  });
  it('measures any triangle, and the law of sines holds', () => {
    const t = triangle({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 1, y: 3 });
    expect(t.angleA + t.angleB + t.angleC).toBeCloseTo(180, 9);
    expect(t.area).toBeCloseTo(6, 9);
    expect(areaFromSine(t)).toBeCloseTo(6, 9);
    const [r1, r2, r3] = sineRatios(t);
    expect(r1).toBeCloseTo(r2, 9);
    expect(r2).toBeCloseTo(r3, 9);
    const { cSquared, aSquared, bSquared, correction } = cosineTerms(t);
    expect(cSquared).toBeCloseTo(aSquared + bSquared - correction, 9);
  });
  it('counts the ambiguous case', () => {
    expect(ssa(10, 5, 30).count).toBe(1);
    expect(ssa(4, 7, 30).count).toBe(2);
    expect(ssa(2, 7, 30).count).toBe(0);
    expect(ssa(3.5, 7, 30)).toMatchObject({ count: 1, angleB: [expect.closeTo(90, 4)] });
  });
  it('places a triangle from two sides and the angle between', () => {
    const { A, B, C } = placeSAS(3, 60, 4);
    const t = triangle(A, B, C);
    expect(t.angleA).toBeCloseTo(60, 9);
    expect(t.b).toBeCloseTo(3, 9);
    expect(t.c).toBeCloseTo(4, 9);
  });
});

describe('waves', () => {
  const w: Wave = { kind: 'sin', amplitude: 2, period: Math.PI, shift: Math.PI / 4, midline: 1 };
  it('evaluates with amplitude, period, shift and midline', () => {
    expect(waveAt(w, Math.PI / 4)).toBeCloseTo(1, 9);
    expect(waveAt(w, Math.PI / 4 + Math.PI / 4)).toBeCloseTo(3, 9);
    expect(periodFrom('sin', 2)).toBeCloseTo(Math.PI, 9);
    expect(periodFrom('tan', 1)).toBeCloseTo(Math.PI, 9);
  });
  it('samples tangent in runs broken at its poles', () => {
    const t: Wave = { kind: 'tan', amplitude: 1, period: Math.PI, shift: 0, midline: 0 };
    expect(poles(t, -Math.PI, Math.PI).map((x) => +x.toFixed(6))).toEqual([-Math.PI / 2, Math.PI / 2].map((x) => +x.toFixed(6)));
    expect(sampleWave(t, -Math.PI, Math.PI).length).toBe(3);
    expect(sampleWave(w, 0, 2 * Math.PI).length).toBe(1);
  });
  it('inverts on the restricted domain and solves on an interval', () => {
    expect(inverseAt('sin', 0.5)).toBeCloseTo(Math.PI / 6, 9);
    expect(inverseAt('sin', 2)).toBeNaN();
    expect(inverseAt('cos', -1)).toBeCloseTo(Math.PI, 9);
    expect(solveOn('sin', 0.5, 0, 2 * Math.PI).map((x) => +x.toFixed(6))).toEqual([Math.PI / 6, (5 * Math.PI) / 6].map((x) => +x.toFixed(6)));
    expect(solveOn('cos', 0, 0, 2 * Math.PI).map((x) => +x.toFixed(6))).toEqual([Math.PI / 2, (3 * Math.PI) / 2].map((x) => +x.toFixed(6)));
    expect(solveOn('tan', 1, 0, 2 * Math.PI).map((x) => +x.toFixed(6))).toEqual([Math.PI / 4, (5 * Math.PI) / 4].map((x) => +x.toFixed(6)));
  });
  it('says whether data fits within a band', () => {
    const points = [0, 1, 2, 3].map((x) => ({ x, y: waveAt(w, x) + 0.1 }));
    expect(fit(w, points, 0.2).within).toBe(true);
    expect(fit(w, points, 0.05)).toMatchObject({ within: false, worst: expect.closeTo(0.1, 9) });
  });
});
