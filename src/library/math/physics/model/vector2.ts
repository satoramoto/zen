/**
 * Pure 2D vector algebra for physics simulation.
 * Pure model: zero React/framework dependencies.
 */

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const vec2 = (x: number = 0, y: number = 0): Vec2 => ({ x, y });

export const VEC2_ZERO: Vec2 = Object.freeze({ x: 0, y: 0 });

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/** 2D cross product returns scalar z-component: a.x * b.y - a.y * b.x */
export function cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

export function magSq(v: Vec2): number {
  return v.x * v.x + v.y * v.y;
}

export function mag(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function norm(v: Vec2): Vec2 {
  const m = mag(v);
  return m > 1e-12 ? { x: v.x / m, y: v.y / m } : VEC2_ZERO;
}

export function distSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function rotate(v: Vec2, angleRad: number): Vec2 {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return {
    x: v.x * c - v.y * s,
    y: v.x * s + v.y * c,
  };
}

export function angle(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}
