// Triangles: the right triangle from an angle and a hypotenuse, any triangle from its vertices,
// the laws of sines and cosines, the ambiguous case, and area. Angles in degrees. Pure.
import { toDegrees, toRadians } from './angle';

export interface Point {
  x: number;
  y: number;
}

/** A right triangle with the right angle at the origin's corner: the marked angle at A, the right angle at C. */
export interface RightTriangle {
  /** The marked angle in degrees, 0 to 90 exclusive. */
  angle: number;
  hypotenuse: number;
  opposite: number;
  adjacent: number;
  /** The three ratios relative to the marked angle. */
  sin: number;
  cos: number;
  tan: number;
}

/** The right triangle with the marked angle and hypotenuse given. */
export function rightTriangle(angle: number, hypotenuse: number): RightTriangle {
  const a = toRadians(angle);
  const opposite = hypotenuse * Math.sin(a);
  const adjacent = hypotenuse * Math.cos(a);
  return { angle, hypotenuse, opposite, adjacent, sin: Math.sin(a), cos: Math.cos(a), tan: Math.tan(a) };
}

/** The angle and hypotenuse of the right triangle whose free vertex is at `p` (the right angle under it on the x-axis, the marked angle at the origin). */
export function rightTriangleFrom(p: Point): { angle: number; hypotenuse: number } {
  return { angle: toDegrees(Math.atan2(p.y, p.x)), hypotenuse: Math.hypot(p.x, p.y) };
}

/** The two special right triangles, by their marked angle. */
export const SPECIAL_RIGHT = [
  { angle: 30, label: '30-60-90', sides: 'opposite 1, adjacent √3, hypotenuse 2' },
  { angle: 45, label: '45-45-90', sides: 'opposite 1, adjacent 1, hypotenuse √2' },
  { angle: 60, label: '60-30-90', sides: 'opposite √3, adjacent 1, hypotenuse 2' },
];

/** Any triangle: vertices A, B, C; side a is opposite A, and so on. */
export interface Triangle {
  A: Point;
  B: Point;
  C: Point;
  a: number;
  b: number;
  c: number;
  /** Angles in degrees. */
  angleA: number;
  angleB: number;
  angleC: number;
  area: number;
}

const dist = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y);

/** The angle at `at` between `p` and `q`, in degrees. */
function angleAt(at: Point, p: Point, q: Point): number {
  const u = { x: p.x - at.x, y: p.y - at.y };
  const v = { x: q.x - at.x, y: q.y - at.y };
  const dot = u.x * v.x + u.y * v.y;
  const cross = u.x * v.y - u.y * v.x;
  return toDegrees(Math.atan2(Math.abs(cross), dot));
}

/** The triangle through three points: sides, angles and area. */
export function triangle(A: Point, B: Point, C: Point): Triangle {
  const a = dist(B, C);
  const b = dist(A, C);
  const c = dist(A, B);
  const area = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
  return { A, B, C, a, b, c, angleA: angleAt(A, B, C), angleB: angleAt(B, A, C), angleC: angleAt(C, A, B), area };
}

/** The law of sines' three ratios a/sin A, b/sin B, c/sin C (equal for any triangle). */
export function sineRatios(t: Triangle): [number, number, number] {
  return [t.a / Math.sin(toRadians(t.angleA)), t.b / Math.sin(toRadians(t.angleB)), t.c / Math.sin(toRadians(t.angleC))];
}

/** The law of cosines for the angle at C: c² = a² + b² − 2ab·cos C, each term. */
export function cosineTerms(t: Triangle): { cSquared: number; aSquared: number; bSquared: number; correction: number } {
  return { cSquared: t.c * t.c, aSquared: t.a * t.a, bSquared: t.b * t.b, correction: 2 * t.a * t.b * Math.cos(toRadians(t.angleC)) };
}

/** The area as ½·a·b·sin C. */
export const areaFromSine = (t: Triangle) => 0.5 * t.a * t.b * Math.sin(toRadians(t.angleC));

/**
 * The ambiguous case (SSA): sides a and b with the angle A opposite a. How many triangles
 * fit, and the angle(s) B that do.
 */
export function ssa(a: number, b: number, angleA: number): { count: 0 | 1 | 2; angleB: number[] } {
  const sinB = (b * Math.sin(toRadians(angleA))) / a;
  if (sinB > 1 + 1e-9) return { count: 0, angleB: [] };
  const B1 = toDegrees(Math.asin(Math.min(1, sinB)));
  const B2 = 180 - B1;
  const fits = (B: number) => angleA + B < 180 - 1e-9;
  const found = [B1, B2].filter((B, i) => fits(B) && (i === 0 || Math.abs(B2 - B1) > 1e-4));
  // When a ≥ b the second solution's angle B exceeds A's partner and never fits, which `fits` finds.
  return { count: found.length as 0 | 1 | 2, angleB: found };
}

/** The vertices of a triangle with the given angle A at the origin, side c along the x-axis, and side b at angle A. */
export function placeSAS(b: number, angleA: number, c: number): { A: Point; B: Point; C: Point } {
  const r = toRadians(angleA);
  return { A: { x: 0, y: 0 }, B: { x: c, y: 0 }, C: { x: b * Math.cos(r), y: b * Math.sin(r) } };
}
