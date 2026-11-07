import type { ReactNode } from 'react';
import type { Complex } from './model/complex';
import './fourier.css';

/** Pixels per unit, and the drawing's size, for a plane showing ±`extent` about the origin. */
export interface Frame {
  size: number;
  extent: number;
  x(z: Complex | number): number;
  y(z: Complex | number): number;
}

export function frame(size: number, extent: number): Frame {
  const k = size / 2 / extent;
  return {
    size,
    extent,
    x: (z) => size / 2 + (typeof z === 'number' ? z : z.re) * k,
    y: (z) => size / 2 - (typeof z === 'number' ? z : z.im) * k,
  };
}

/** A square SVG of the complex plane: faint axes, a unit circle on request, then its children. */
export function Plane({ f, unitCircle = false, label, children }: { f: Frame; unitCircle?: boolean; label: string; children?: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${f.size} ${f.size}`} className="zen-fourier__plane" role="img" aria-label={label}>
      <line x1={0} y1={f.y(0)} x2={f.size} y2={f.y(0)} className="zen-fourier__axis" />
      <line x1={f.x(0)} y1={0} x2={f.x(0)} y2={f.size} className="zen-fourier__axis" />
      {unitCircle && <circle cx={f.x(0)} cy={f.y(0)} r={f.x(1) - f.x(0)} className="zen-fourier__unit" />}
      {children}
    </svg>
  );
}

/** A polyline through complex points. */
export function Trace({ f, points, className = 'zen-fourier__trace', closed = false }: { f: Frame; points: Complex[]; className?: string; closed?: boolean }) {
  if (points.length === 0) return null;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${f.x(p).toFixed(2)} ${f.y(p).toFixed(2)}`).join('') + (closed ? 'Z' : '');
  return <path d={d} className={className} />;
}

/** An arrow from one complex point to another, with a small head. */
export function Arrow({ f, from, to, className = 'zen-fourier__arrow' }: { f: Frame; from: Complex; to: Complex; className?: string }) {
  const x1 = f.x(from);
  const y1 = f.y(from);
  const x2 = f.x(to);
  const y2 = f.y(to);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.5) return null;
  const head = Math.min(7, len / 2);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  return (
    <g className={className}>
      <line x1={x1} y1={y1} x2={bx} y2={by} />
      <path d={`M${x2} ${y2} L${bx - uy * head * 0.45} ${by + ux * head * 0.45} L${bx + uy * head * 0.45} ${by - ux * head * 0.45} Z`} />
    </g>
  );
}

/** A rotating arrow's circle: where its tip can go. */
export function Orbit({ f, centre, radius }: { f: Frame; centre: Complex; radius: number }) {
  const r = (f.x(1) - f.x(0)) * radius;
  if (r < 0.5) return null;
  return <circle cx={f.x(centre)} cy={f.y(centre)} r={r} className="zen-fourier__orbit" />;
}

/** A labelled dot. */
export function Dot({ f, at, className = 'zen-fourier__dot', r = 3.5 }: { f: Frame; at: Complex; className?: string; r?: number }) {
  return <circle cx={f.x(at)} cy={f.y(at)} r={r} className={className} />;
}

/** The size and angle of a coefficient, said in words. */
export const describe = (c: Complex): string => {
  const r = Math.hypot(c.re, c.im);
  if (r < 0.005) return 'size 0.00';
  const deg = Math.round((Math.atan2(c.im, c.re) * 180) / Math.PI);
  return `size ${r.toFixed(2)}, angle ${deg}°`;
};
