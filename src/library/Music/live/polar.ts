// Polar geometry for the round live panes (ChordCompass, OrbitClock, LandingDial, SignalSpine): points on a
// circle and annular sectors as SVG path data. Angles are turns (0–1), 0 at twelve o'clock,
// clockwise, so a phase reads straight onto a dial.

export interface Point {
  x: number;
  y: number;
}

/** The point `r` from `(cx, cy)` at `turn` (0 is straight up). */
export function polar(cx: number, cy: number, r: number, turn: number): Point {
  const a = turn * Math.PI * 2 - Math.PI / 2;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

const f = (n: number) => Number(n.toFixed(2));

/** An annular sector from `from` to `to` (turns) between radii `r0` and `r1`. */
export function sector(cx: number, cy: number, r0: number, r1: number, from: number, to: number): string {
  const large = to - from > 0.5 ? 1 : 0;
  const a = polar(cx, cy, r1, from);
  const b = polar(cx, cy, r1, to);
  const c = polar(cx, cy, r0, to);
  const d = polar(cx, cy, r0, from);
  return `M${f(a.x)} ${f(a.y)}A${r1} ${r1} 0 ${large} 1 ${f(b.x)} ${f(b.y)}L${f(c.x)} ${f(c.y)}A${r0} ${r0} 0 ${large} 0 ${f(d.x)} ${f(d.y)}Z`;
}

/** An open arc of radius `r` from `from` to `to` (turns). A full turn is drawn as two halves. */
export function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  if (to - from >= 0.999) return `${arc(cx, cy, r, from, from + 0.5)}${arc(cx, cy, r, from + 0.5, to)}`;
  const large = to - from > 0.5 ? 1 : 0;
  const a = polar(cx, cy, r, from);
  const b = polar(cx, cy, r, to);
  return `M${f(a.x)} ${f(a.y)}A${r} ${r} 0 ${large} 1 ${f(b.x)} ${f(b.y)}`;
}

/** The fractional part, always 0–1 (so negative beats wrap too). */
export const frac = (n: number): number => ((n % 1) + 1) % 1;
