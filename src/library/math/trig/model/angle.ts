// Angles: degrees and radians, neat multiples of π, quadrants, reference and coterminal angles.
// Pure; the figures and the trigonometry book read it.

export const TAU = 2 * Math.PI;

export const toRadians = (deg: number) => (deg * Math.PI) / 180;
export const toDegrees = (rad: number) => (rad * 180) / Math.PI;

/** The angle brought into [0, 360). */
export const normalise = (deg: number) => ((deg % 360) + 360) % 360;

/** The coterminal angle in [0, 360), and how many whole turns away `deg` was. */
export function coterminal(deg: number): { angle: number; turns: number } {
  const angle = normalise(deg);
  return { angle, turns: Math.round((deg - angle) / 360) };
}

/** Which quadrant (1–4) the angle's terminal side is in; 0 on an axis. */
export function quadrant(deg: number): 0 | 1 | 2 | 3 | 4 {
  const a = normalise(deg);
  if (a % 90 === 0) return 0;
  return (Math.floor(a / 90) + 1) as 1 | 2 | 3 | 4;
}

/** The acute angle between the terminal side and the x-axis, 0 to 90. */
export function referenceAngle(deg: number): number {
  const a = normalise(deg);
  const r = a % 180;
  return r > 90 ? 180 - r : r;
}

/** The signs of sine, cosine and tangent for the angle: +1, −1, or 0 on an axis. */
export function signs(deg: number): { sin: -1 | 0 | 1; cos: -1 | 0 | 1; tan: -1 | 0 | 1 } {
  const a = normalise(deg);
  const sign = (v: number): -1 | 0 | 1 => (Math.abs(v) < 1e-9 ? 0 : v > 0 ? 1 : -1);
  const s = sign(Math.sin(toRadians(a)));
  const c = sign(Math.cos(toRadians(a)));
  return { sin: s, cos: c, tan: s === 0 || c === 0 ? 0 : ((s * c) as -1 | 1) };
}

/** The special angles, every 30° and 45° round the circle. */
export const SPECIAL_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];

/** The nearest special angle to `deg`, and how far it is (in degrees, 0 to 15). */
export function nearestSpecial(deg: number): { angle: number; off: number } {
  const a = normalise(deg);
  let best = { angle: 0, off: 360 };
  for (const s of [...SPECIAL_ANGLES, 360]) {
    const off = Math.abs(a - s);
    if (off < best.off) best = { angle: s % 360, off };
  }
  return best;
}

/**
 * A neat multiple of π, when the angle is one with a denominator up to 12: `{ n, d }` for
 * n·π/d in lowest terms (d = 1 for whole multiples; n = 0 for zero). Otherwise undefined.
 */
export function neatPi(deg: number): { n: number; d: number } | undefined {
  for (const d of [1, 2, 3, 4, 6, 8, 12]) {
    const n = (deg * d) / 180;
    if (Math.abs(n - Math.round(n)) < 1e-9) return reduce(Math.round(n), d);
  }
  return undefined;
}

function reduce(n: number, d: number): { n: number; d: number } {
  const g = gcd(Math.abs(n), d);
  return { n: n / g, d: d / g };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a || 1 : gcd(b, a % b);
}

/** The angle in radians as words: "π/3", "2π/3", "−π", "1.00 rad" when it isn't neat. */
export function radiansText(deg: number): string {
  const neat = neatPi(deg);
  if (!neat) return `${toRadians(deg).toFixed(2)} rad`;
  if (neat.n === 0) return '0';
  const sign = neat.n < 0 ? '−' : '';
  const n = Math.abs(neat.n);
  const num = n === 1 ? 'π' : `${n}π`;
  return neat.d === 1 ? `${sign}${num}` : `${sign}${num}/${neat.d}`;
}

/** The same in TeX. */
export function radiansTex(deg: number): string {
  const neat = neatPi(deg);
  if (!neat) return `${toRadians(deg).toFixed(2)}`;
  if (neat.n === 0) return '0';
  const sign = neat.n < 0 ? '-' : '';
  const n = Math.abs(neat.n);
  const num = n === 1 ? '\\pi' : `${n}\\pi`;
  return neat.d === 1 ? `${sign}${num}` : `${sign}\\frac{${num}}{${neat.d}}`;
}

/** The exact value of a trig function at a special angle as text, or the decimal otherwise. */
export function exactText(value: number): string {
  const table: [number, string][] = [
    [0, '0'],
    [0.5, '½'],
    [Math.SQRT1_2, '√2/2'],
    [Math.sqrt(3) / 2, '√3/2'],
    [1, '1'],
    [1 / Math.sqrt(3), '√3/3'],
    [Math.sqrt(3), '√3'],
  ];
  for (const [v, text] of table) {
    if (Math.abs(Math.abs(value) - v) < 1e-9) return value < 0 ? `−${text}` : text;
  }
  return (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);
}
