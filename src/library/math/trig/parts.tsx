// Shared drawing parts for the trigonometry figures: a plane with a frame, axes and grid, a
// circle, an angle arc, a labelled length, and a handle the reader drags with a pointer or
// steps with the arrow keys. Plain SVG, the contract's colours (trig.css).
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { Text } from '../../primitives/Text';
import './trig.css';

/** Maths coordinates to pixels for a drawing `width` × `height` showing x in [x0, x1] and y in [y0, y1]. */
export interface Frame {
  width: number;
  height: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  x(v: number): number;
  y(v: number): number;
  /** Back from pixels. */
  fromPx(px: number, py: number): { x: number; y: number };
  /** Pixels per unit along x and y. */
  kx: number;
  ky: number;
}

export function frame(width: number, height: number, x: [number, number], y: [number, number]): Frame {
  const kx = width / (x[1] - x[0]);
  const ky = height / (y[1] - y[0]);
  return {
    width,
    height,
    x0: x[0],
    x1: x[1],
    y0: y[0],
    y1: y[1],
    kx,
    ky,
    x: (v) => (v - x[0]) * kx,
    y: (v) => height - (v - y[0]) * ky,
    fromPx: (px, py) => ({ x: x[0] + px / kx, y: y[0] + (height - py) / ky }),
  };
}

/** A square frame showing ±`extent` about the origin. */
export const square = (size: number, extent: number) => frame(size, size, [-extent, extent], [-extent, extent]);

/** The least share of its designed width a drawing is shown at: below it, its labels get too small to read. */
const LEAST_SCALE = 0.72;

/**
 * The SVG itself: an image with a label, its children drawn in the frame. It fills the column,
 * but never shrinks below `LEAST_SCALE` of its designed width: in a narrower column its box
 * scrolls sideways instead, so a phone shows a legible drawing (the page itself never widens).
 */
export function Plane({ f, label, svgRef, children, className = '' }: { f: Frame; label: string; svgRef?: RefObject<SVGSVGElement | null>; children?: ReactNode; className?: string }) {
  return (
    <div className="zen-trig__scroll">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${f.width} ${f.height}`}
        className={`zen-trig__plane ${className}`}
        style={{ minInlineSize: `${Math.round(f.width * LEAST_SCALE)}px` }}
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </div>
  );
}

/** The two axes through the origin (where they are in the frame). */
export function Axes({ f }: { f: Frame }) {
  return (
    <g>
      {f.y0 <= 0 && f.y1 >= 0 && <line x1={0} y1={f.y(0)} x2={f.width} y2={f.y(0)} className="zen-trig__axis" />}
      {f.x0 <= 0 && f.x1 >= 0 && <line x1={f.x(0)} y1={0} x2={f.x(0)} y2={f.height} className="zen-trig__axis" />}
    </g>
  );
}

/** Faint grid lines every `step` units. */
export function Grid({ f, step = 1 }: { f: Frame; step?: number }) {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let v = Math.ceil(f.x0 / step) * step; v <= f.x1 + 1e-9; v += step) xs.push(v);
  for (let v = Math.ceil(f.y0 / step) * step; v <= f.y1 + 1e-9; v += step) ys.push(v);
  return (
    <g>
      {xs.map((v) => (
        <line key={`x${v}`} x1={f.x(v)} y1={0} x2={f.x(v)} y2={f.height} className="zen-trig__grid" />
      ))}
      {ys.map((v) => (
        <line key={`y${v}`} x1={0} y1={f.y(v)} x2={f.width} y2={f.y(v)} className="zen-trig__grid" />
      ))}
    </g>
  );
}

/** A circle, centre and radius in maths units (the frame's x scale). */
export function Circle({ f, cx = 0, cy = 0, r = 1, className = 'zen-trig__unit' }: { f: Frame; cx?: number; cy?: number; r?: number; className?: string }) {
  return <circle cx={f.x(cx)} cy={f.y(cy)} r={r * f.kx} className={className} />;
}

/** A segment between two maths points. */
export function Segment({ f, from, to, className = 'zen-trig__line' }: { f: Frame; from: { x: number; y: number }; to: { x: number; y: number }; className?: string }) {
  return <line x1={f.x(from.x)} y1={f.y(from.y)} x2={f.x(to.x)} y2={f.y(to.y)} className={className} />;
}

/** A closed or open path through maths points. */
export function Path({ f, points, closed = false, className = 'zen-trig__line' }: { f: Frame; points: { x: number; y: number }[]; closed?: boolean; className?: string }) {
  if (points.length === 0) return null;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${f.x(p.x).toFixed(2)} ${f.y(p.y).toFixed(2)}`).join('') + (closed ? 'Z' : '');
  return <path d={d} className={className} />;
}

/** An arc of angle from `from` to `to` degrees (anticlockwise) at radius `r` about a centre, as a sector when filled. */
export function Arc({ f, cx = 0, cy = 0, r, from, to, sector = false, className = 'zen-trig__angle' }: { f: Frame; cx?: number; cy?: number; r: number; from: number; to: number; sector?: boolean; className?: string }) {
  const a0 = (from * Math.PI) / 180;
  const a1 = (to * Math.PI) / 180;
  const sweep = to - from;
  if (Math.abs(sweep) < 1e-6) return null;
  const turns = Math.floor(Math.abs(sweep) / 360);
  const rest = Math.abs(sweep) - turns * 360;
  const x = (a: number) => f.x(cx + r * Math.cos(a));
  const y = (a: number) => f.y(cy + r * Math.sin(a));
  const R = r * f.kx;
  const dir = sweep >= 0 ? 0 : 1; // SVG's y is down, so anticlockwise in maths is sweep-flag 0
  const large = rest > 180 ? 1 : 0;
  const mid = a0 + ((sweep >= 0 ? 1 : -1) * Math.PI);
  const full = turns > 0 ? `M${x(a0)} ${y(a0)} A${R} ${R} 0 1 ${dir} ${x(mid)} ${y(mid)} A${R} ${R} 0 1 ${dir} ${x(a0)} ${y(a0)} ` : '';
  const partial = rest > 1e-6 ? `M${x(a0)} ${y(a0)} A${R} ${R} 0 ${large} ${dir} ${x(a1)} ${y(a1)}` : '';
  const d = sector ? `M${f.x(cx)} ${f.y(cy)} L${x(a0)} ${y(a0)} ${partial.replace(/^M[^A]*/, '')} Z` : `${full}${partial}`;
  return <path d={d} className={sector ? `${className}-fill` : className} fill={sector ? undefined : 'none'} />;
}

/** A small right-angle mark at a corner, between the directions to `p` and `q`. */
export function RightAngle({ f, at, p, q, size = 0.12 }: { f: Frame; at: { x: number; y: number }; p: { x: number; y: number }; q: { x: number; y: number }; size?: number }) {
  const u = unit(p.x - at.x, p.y - at.y);
  const v = unit(q.x - at.x, q.y - at.y);
  const a = { x: at.x + u.x * size, y: at.y + u.y * size };
  const b = { x: at.x + (u.x + v.x) * size, y: at.y + (u.y + v.y) * size };
  const c = { x: at.x + v.x * size, y: at.y + v.y * size };
  return <Path f={f} points={[a, b, c]} className="zen-trig__quiet" />;
}

const unit = (x: number, y: number) => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};

/** Text at a maths point, offset in pixels. */
export function Label({ f, at, dx = 0, dy = 0, children, className = 'zen-trig__label', anchor = 'start' }: { f: Frame; at: { x: number; y: number }; dx?: number; dy?: number; children: ReactNode; className?: string; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text x={f.x(at.x) + dx} y={f.y(at.y) + dy} className={className} textAnchor={anchor}>
      {children}
    </text>
  );
}

/** A length drawn as a segment with its value beside it. */
export function Length({ f, from, to, text, className = 'zen-trig__line', labelClass = 'zen-trig__label', side = 1 }: { f: Frame; from: { x: number; y: number }; to: { x: number; y: number }; text: string; className?: string; labelClass?: string; side?: 1 | -1 }) {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const n = unit(-(to.y - from.y), to.x - from.x);
  return (
    <g>
      <Segment f={f} from={from} to={to} className={className} />
      <Label f={f} at={mid} dx={n.x * 12 * side} dy={-n.y * 12 * side + 4} className={labelClass} anchor="middle">
        {text}
      </Label>
    </g>
  );
}

/**
 * Pointer dragging over a plane: `onMove` hears the maths point under the pointer while a
 * handle is held. Returns the SVG ref for the `Plane` and the handlers for a `Handle`.
 */
export function useDrag(f: Frame, onMove: (p: { x: number; y: number }) => void) {
  const ref = useRef<SVGSVGElement | null>(null);
  // A ref as well as state: a move can arrive before React re-renders after the press.
  const held = useRef(false);
  const [dragging, setDragging] = useState(false);
  const toMaths = (e: PointerEvent) => {
    const svg = ref.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    // Through the SVG's own matrix, so a letterboxed drawing (a box wider than the viewBox) maps true.
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return f.fromPx(pt.x, pt.y);
  };
  const onPointerDown = (e: PointerEvent<SVGGElement>) => {
    e.preventDefault();
    (e.currentTarget as SVGGElement).setPointerCapture?.(e.pointerId);
    held.current = true;
    setDragging(true);
    const p = toMaths(e);
    if (p) onMove(p);
  };
  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    if (!held.current) return;
    const p = toMaths(e);
    if (p) onMove(p);
  };
  const onPointerUp = (e: PointerEvent<SVGGElement>) => {
    (e.currentTarget as SVGGElement).releasePointerCapture?.(e.pointerId);
    held.current = false;
    setDragging(false);
  };
  return { ref, dragging, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}

export interface HandleProps {
  f: Frame;
  at: { x: number; y: number };
  /** Its accessible name. */
  label: string;
  /** For a one-dimensional handle: the value it reports, its range, and what the arrow keys do. */
  value?: number;
  min?: number;
  max?: number;
  /** Arrow keys: the step added for Right/Up and subtracted for Left/Down (one-dimensional), or {dx, dy} applied per key (two-dimensional). */
  onKey?(direction: 'left' | 'right' | 'up' | 'down', big: boolean): void;
  /** The pointer handlers from `useDrag`. */
  drag: ReturnType<typeof useDrag>;
  r?: number;
  /** Said after the value for assistive technology: "°". */
  valueText?: string;
}

/**
 * A draggable, focusable handle. With `value` it is a slider to assistive technology (the arrow
 * keys step it); without, a button that the arrow keys move in two dimensions. Shift steps big.
 */
export function Handle({ f, at, label, value, min, max, onKey, drag, r = 7, valueText }: HandleProps) {
  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    const map: Record<string, 'left' | 'right' | 'up' | 'down'> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const d = map[e.key];
    if (!d || !onKey) return;
    e.preventDefault();
    onKey(d, e.shiftKey);
  };
  const slider = value !== undefined;
  return (
    <g
      className="zen-trig__handle"
      tabIndex={0}
      role={slider ? 'slider' : 'button'}
      aria-label={label}
      aria-valuenow={slider ? Math.round(value * 100) / 100 : undefined}
      aria-valuemin={slider ? min : undefined}
      aria-valuemax={slider ? max : undefined}
      aria-valuetext={slider ? valueText : undefined}
      data-dragging={drag.dragging ? '' : undefined}
      onKeyDown={onKeyDown}
      {...drag.handlers}
    >
      <circle cx={f.x(at.x)} cy={f.y(at.y)} r={r + 8} fill="transparent" stroke="none" />
      <circle cx={f.x(at.x)} cy={f.y(at.y)} r={r} />
    </g>
  );
}

/** A row of readouts under a figure: `label value` pairs, announced politely. */
export function Readouts({ items, live = true }: { items: { label: string; value: string; tone?: 1 | 2 | 3 | 4 | 5 | 'secondary' }[]; live?: boolean }) {
  return (
    <div className="zen-trig__readouts" aria-live={live ? 'polite' : undefined}>
      {items.map((it) => (
        <span key={it.label} className="zen-trig__readout">
          <Text role="label" size="caption" tone={it.tone ?? 'secondary'}>
            {it.label}
          </Text>
          <Text role="numeral" size="caption" tone="primary" tabular>
            {it.value}
          </Text>
        </span>
      ))}
    </div>
  );
}

/** The maths point for an angle on a circle. */
export const onCircle = (deg: number, r = 1, cx = 0, cy = 0) => ({ x: cx + r * Math.cos((deg * Math.PI) / 180), y: cy + r * Math.sin((deg * Math.PI) / 180) });

/** The angle in degrees of a maths point about a centre, in [0, 360). */
export const angleOf = (p: { x: number; y: number }, cx = 0, cy = 0) => (((Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 360) % 360);

/** Clamp a number to a range. */
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
