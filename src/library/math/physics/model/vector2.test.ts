import { describe, expect, it } from 'vitest';
import { add, angle, cross, dist, dot, lerp, mag, norm, rotate, scale, sub, vec2 } from './vector2';

describe('vector2', () => {
  it('performs basic arithmetic', () => {
    const a = vec2(3, 4);
    const b = vec2(1, -2);
    expect(add(a, b)).toEqual({ x: 4, y: 2 });
    expect(sub(a, b)).toEqual({ x: 2, y: 6 });
    expect(scale(a, 2.5)).toEqual({ x: 7.5, y: 10 });
    expect(dot(a, b)).toBe(3 * 1 + 4 * -2); // -5
    expect(cross(a, b)).toBe(3 * -2 - 4 * 1); // -10
  });

  it('computes magnitude, norm, and distance', () => {
    const v = vec2(3, 4);
    expect(mag(v)).toBe(5);
    const u = norm(v);
    expect(u.x).toBeCloseTo(0.6);
    expect(u.y).toBeCloseTo(0.8);
    expect(mag(u)).toBeCloseTo(1);

    expect(dist(vec2(1, 1), vec2(4, 5))).toBe(5);
  });

  it('rotates and calculates angle', () => {
    const v = vec2(1, 0);
    const rot = rotate(v, Math.PI / 2);
    expect(rot.x).toBeCloseTo(0);
    expect(rot.y).toBeCloseTo(1);
    expect(angle(rot)).toBeCloseTo(Math.PI / 2);
  });

  it('interpolates vectors', () => {
    const a = vec2(0, 0);
    const b = vec2(10, 20);
    expect(lerp(a, b, 0.5)).toEqual({ x: 5, y: 10 });
  });
});
