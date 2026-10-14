// Cord geometry for faced ports: where a cord leaves a port depends on the face the port sits on
// (`n`, `e`, `s`, `w`), so a pin on the top of a node sends its cord up, not round to the right.
// Pure functions in graph units; `Graph` measures the ports and draws what these return.

export type GraphFace = 'n' | 'e' | 's' | 'w';

export interface Spot {
  x: number;
  y: number;
}

/** A drawn cord: its SVG path, where a label sits (the middle of its length) and a point near its far end. */
export interface Route {
  d: string;
  mid: Spot;
  /** A point most of the way along, towards the inlet: where an amount reads. */
  near: Spot;
}

/** The outward unit vector of each face. */
export const NORMAL: Record<GraphFace, Spot> = { n: { x: 0, y: -1 }, e: { x: 1, y: 0 }, s: { x: 0, y: 1 }, w: { x: -1, y: 0 } };

/** The face a direction points out of: the dominant axis of `(dx, dy)`. */
export function faceToward(dx: number, dy: number): GraphFace {
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'e' : 'w';
  return dy >= 0 ? 's' : 'n';
}

const add = (a: Spot, v: Spot, k: number): Spot => ({ x: a.x + v.x * k, y: a.y + v.y * k });
const dist = (a: Spot, b: Spot) => Math.hypot(b.x - a.x, b.y - a.y);
const dot = (a: Spot, b: Spot) => a.x * b.x + a.y * b.y;
const sub = (a: Spot, b: Spot): Spot => ({ x: a.x - b.x, y: a.y - b.y });
const r = (n: number) => Math.round(n * 100) / 100;

function cubicAt(a: Spot, c1: Spot, c2: Spot, b: Spot, t: number): Spot {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return { x: w[0] * a.x + w[1] * c1.x + w[2] * c2.x + w[3] * b.x, y: w[0] * a.y + w[1] * c1.y + w[2] * c2.y + w[3] * b.y };
}

/**
 * A curve from outlet `a` on face `fa` to inlet `b` on face `fb`: a cubic whose handles leave
 * each end along its face's normal, reaching at least 30 units. With `e` → `w` it is exactly
 * `cordPath`'s shape.
 */
export function curveRoute(a: Spot, fa: GraphFace, b: Spot, fb: GraphFace): Route {
  const na = NORMAL[fa];
  const nb = NORMAL[fb];
  const horizontal = fa === 'e' && fb === 'w';
  const reach = horizontal ? Math.max(30, Math.abs(b.x - a.x) * 0.5) : Math.max(30, Math.min(dist(a, b) * 0.5, 220));
  const c1 = add(a, na, reach);
  const c2 = add(b, nb, reach);
  return {
    d: `M ${r(a.x)} ${r(a.y)} C ${r(c1.x)} ${r(c1.y)}, ${r(c2.x)} ${r(c2.y)}, ${r(b.x)} ${r(b.y)}`,
    mid: cubicAt(a, c1, c2, b, 0.5),
    near: cubicAt(a, c1, c2, b, 0.8),
  };
}

/** Drop repeated and collinear interior points. */
function simplify(points: Spot[]): Spot[] {
  const out: Spot[] = [];
  for (const p of points) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - p.x) < 0.01 && Math.abs(last.y - p.y) < 0.01) continue;
    out.push(p);
  }
  for (let i = out.length - 2; i >= 1; i--) {
    const a = out[i - 1];
    const b = out[i];
    const c = out[i + 1];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(cross) < 0.01) out.splice(i, 1);
  }
  return out;
}

/** The point at a fraction of a polyline's length. */
function along(points: Spot[], t: number): Spot {
  const lengths = points.slice(1).map((p, i) => dist(points[i], p));
  let left = lengths.reduce((s, l) => s + l, 0) * t;
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const k = lengths[i] === 0 ? 0 : Math.min(1, left / lengths[i]);
      return { x: points[i].x + (points[i + 1].x - points[i].x) * k, y: points[i].y + (points[i + 1].y - points[i].y) * k };
    }
    left -= lengths[i];
  }
  return points[0];
}

/**
 * Cut each corner of an orthogonal polyline with a 45° chamfer: as long as the shorter of the two
 * legs allows (half of an inner leg, all of an end leg), so a single bend becomes one diagonal run.
 */
function chamfer(points: Spot[], cap: number, stub: number): Spot[] {
  if (points.length < 3) return points;
  const out: Spot[] = [points[0]];
  const legs = points.slice(1).map((p, i) => dist(points[i], p));
  // How much of each leg the corners at its two ends may share; an end leg keeps its stub square.
  const room = (i: number) => (i === 0 || i === legs.length - 1 ? Math.max(0, legs[i] - stub) : legs[i] / 2);
  for (let i = 1; i < points.length - 1; i++) {
    const c = Math.min(room(i - 1), room(i), cap);
    const before = points[i - 1];
    const at = points[i];
    const after = points[i + 1];
    const inV = { x: (at.x - before.x) / (legs[i - 1] || 1), y: (at.y - before.y) / (legs[i - 1] || 1) };
    const outV = { x: (after.x - at.x) / (legs[i] || 1), y: (after.y - at.y) / (legs[i] || 1) };
    out.push(add(at, inV, -c), add(at, outV, c));
  }
  out.push(points[points.length - 1]);
  return simplify(out);
}

/**
 * The orthogonal skeleton between two faced ends, both already stepped out by `stub` (`a1`, `b1`).
 * Forward cases bend once or twice; a cord that has to go back round runs through a channel
 * halfway between the ends, or beyond both when they're level.
 */
function skeleton(a1: Spot, na: Spot, b1: Spot, nb: Spot, stub: number): Spot[] {
  const gap = sub(b1, a1);
  const parallel = na.x * nb.y - na.y * nb.x === 0;
  if (!parallel) {
    // One corner: along a's normal, then into b. Forward when b lies ahead of a and a ahead of b.
    const corner = na.x !== 0 ? { x: b1.x, y: a1.y } : { x: a1.x, y: b1.y };
    if (dot(gap, na) >= 0 && dot(sub(a1, b1), nb) >= 0) return [corner];
    const other = na.x !== 0 ? { x: a1.x, y: b1.y } : { x: b1.x, y: a1.y };
    return [other];
  }
  if (dot(na, nb) < 0) {
    // Facing each other (e → w, n → s).
    if (dot(gap, na) >= 0) {
      // Forward: a Z through the middle.
      if (na.x !== 0) {
        const mx = (a1.x + b1.x) / 2;
        return [
          { x: mx, y: a1.y },
          { x: mx, y: b1.y },
        ];
      }
      const my = (a1.y + b1.y) / 2;
      return [
        { x: a1.x, y: my },
        { x: b1.x, y: my },
      ];
    }
    // Backward: a channel between them across the normal, or round the side when they're level.
    if (na.x !== 0) {
      const level = Math.abs(gap.y) < stub * 4;
      const my = level ? Math.max(a1.y, b1.y) + stub * 4 : (a1.y + b1.y) / 2;
      return [
        { x: a1.x, y: my },
        { x: b1.x, y: my },
      ];
    }
    const level = Math.abs(gap.x) < stub * 4;
    const mx = level ? Math.max(a1.x, b1.x) + stub * 4 : (a1.x + b1.x) / 2;
    return [
      { x: mx, y: a1.y },
      { x: mx, y: b1.y },
    ];
  }
  // Both the same way: out to whichever end reaches further, across, and back.
  if (na.x !== 0) {
    const mx = na.x > 0 ? Math.max(a1.x, b1.x) : Math.min(a1.x, b1.x);
    return [
      { x: mx, y: a1.y },
      { x: mx, y: b1.y },
    ];
  }
  const my = na.y > 0 ? Math.max(a1.y, b1.y) : Math.min(a1.y, b1.y);
  return [
    { x: a1.x, y: my },
    { x: b1.x, y: my },
  ];
}

/**
 * A circuit-board trace from `a` on face `fa` to `b` on face `fb`: straight runs and 45° bends.
 * Each end leaves its face square for `stub` units before it may bend. `cap` limits a chamfer.
 */
export function traceRoute(a: Spot, fa: GraphFace, b: Spot, fb: GraphFace, stub = 16, cap = 160): Route {
  const na = NORMAL[fa];
  const nb = NORMAL[fb];
  const a1 = add(a, na, stub);
  const b1 = add(b, nb, stub);
  // The two stubs stay square to their faces: only the corners between them are cut.
  const points = chamfer(simplify([a, a1, ...skeleton(a1, na, b1, nb, stub), b1, b]), cap, stub);
  return {
    d: points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${r(p.x)} ${r(p.y)}`).join(' '),
    mid: along(points, 0.5),
    near: along(points, 0.82),
  };
}

/** The route for a cord between two faced ends in a routing style. */
export function route(routing: 'curve' | 'trace', a: Spot, fa: GraphFace, b: Spot, fb: GraphFace): Route {
  return routing === 'trace' ? traceRoute(a, fa, b, fb) : curveRoute(a, fa, b, fb);
}
