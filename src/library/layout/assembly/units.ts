// Scale units to px, from the facets (never the DOM), and the pack's principles resolved.
import { RANKS, SPACE_STEPS, type Facets, type PackPrinciples, type Rank } from '../../contract';
import type { Step } from '../../primitives/step';
import type { TextRole } from '../../primitives/Text';
import type { Box, Length, Need, Principles, Units } from './types';

/** Each text role's leading, as Text.css sets it (a test holds the two together). */
export const ROLE_LEADING: Record<TextRole, number> = {
  display: 1.1,
  numeral: 1,
  heading: 1.25,
  body: 1.4,
  label: 1.2,
  caption: 1.3,
  code: 1.4,
};

/** The average glyph width of UI text, as a fraction of its size: what `chars` counts with. */
export const CHAR_WIDTH = 0.6;

/** A spacing step in px at this scale. */
export function stepPx(step: Step, unit: number): number {
  return step === 0 ? 0 : SPACE_STEPS[step - 1] * unit;
}

const has = <K extends string>(o: object, k: K): o is Record<K, unknown> => k in o;

/** A length in px. */
export function resolveLength(len: Length, p: Principles): number {
  if (len === 0) return 0;
  if (has(len, 'max')) return Math.max(0, ...(len.max as readonly Length[]).map((l) => resolveLength(l, p)));
  if (has(len, 'sum')) return (len.sum as readonly Length[]).reduce<number>((t, l) => t + resolveLength(l, p), 0);
  const u = len as Units;
  const { unit, control, sizes } = p.scale;
  let px = 0;
  if (u.control) px += u.control * control;
  if (u.target) px += u.target * Math.max(control, p.minTarget);
  if (u.space !== undefined) for (const s of typeof u.space === 'number' ? [u.space] : u.space) px += stepPx(s, unit);
  if (u.unit) px += u.unit * unit;
  for (const [role, n] of Object.entries(u.lines ?? {}) as [TextRole, number][]) px += n * sizes[role] * ROLE_LEADING[role];
  for (const [role, n] of Object.entries(u.chars ?? {}) as [TextRole, number][]) px += n * sizes[role] * CHAR_WIDTH;
  if (u.px) px += u.px;
  return px;
}

export function resolveNeed(need: Need, p: Principles): { w: number; h: number } {
  return { w: resolveLength(need.w, p), h: resolveLength(need.h, p) };
}

/* ---------- composing needs: a component adds up its parts ---------- */

/** The sum of lengths. */
export const lengthSum = (...parts: Length[]): Length => ({ sum: parts });
/** The largest of lengths. */
export const lengthMax = (...parts: Length[]): Length => ({ max: parts });

/** Needs side by side with a gap step between them: widths add, the height is the tallest. */
export function needsAcross(gap: Step, ...needs: Need[]): Need {
  const gaps: Length = needs.length > 1 ? { space: Array<Step>(needs.length - 1).fill(gap) } : 0;
  return { w: lengthSum(...needs.map((n) => n.w), gaps), h: lengthMax(...needs.map((n) => n.h)) };
}

/** Needs stacked with a gap step between them: heights add, the width is the widest. */
export function needsDown(gap: Step, ...needs: Need[]): Need {
  const gaps: Length = needs.length > 1 ? { space: Array<Step>(needs.length - 1).fill(gap) } : 0;
  return { w: lengthMax(...needs.map((n) => n.w)), h: lengthSum(...needs.map((n) => n.h), gaps) };
}

/* ---------- the materials' CSS lengths ---------- */

/** Splits CSS on whitespace outside parentheses. */
function tokens(css: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of css.trim()) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * One CSS length from a facet, in px: `0`, a px length, a spacing step, the control height or a
 * type size variable, or `calc(<one of those> * n)` / `calc(n * …)`. Anything else throws,
 * so a material the solver can't read is caught by the tests, not guessed.
 */
export function cssPx(token: string, scale: Facets['scale']): number {
  const t = token.trim();
  if (/^-?0(\.0+)?$/.test(t)) return 0;
  const lit = /^(-?\d*\.?\d+)p[x]$/.exec(t);
  if (lit) return Number(lit[1]);
  const space = /^var\(--space-([1-6])\)$/.exec(t);
  if (space) return stepPx(Number(space[1]) as Step, scale.unit);
  if (t === 'var(--control-h)') return scale.control;
  const size = /^var\(--size-([a-z]+)\)$/.exec(t);
  if (size && size[1] in scale.sizes) return scale.sizes[size[1] as keyof Facets['scale']['sizes']];
  const calc = /^calc\((.+)\s\*\s(.+)\)$/.exec(t);
  if (calc) {
    const [a, b] = [calc[1].trim(), calc[2].trim()];
    return /^-?\d*\.?\d+$/.test(b) ? cssPx(a, scale) * Number(b) : cssPx(b, scale) * Number(a);
  }
  throw new Error(`assembly: can't read the CSS length '${token}'`);
}

/** A padding shorthand (one to four lengths) in px. */
export function cssBox(css: string, scale: Facets['scale']): Box {
  const v = tokens(css).map((t) => cssPx(t, scale));
  const [top, right = top, bottom = top, left = right] = v;
  return { top, right, bottom, left };
}

/** The rank ladder as numbers: the first rank is 100, each next one 20 less. */
export function rankNumbers(ranks: readonly Rank[] = RANKS): Record<Rank, number> {
  const out = {} as Record<Rank, number>;
  ranks.forEach((r, i) => (out[r] = 100 - i * 20));
  for (const r of RANKS) if (!(r in out)) throw new Error(`assembly: the rank ladder is missing '${r}'`);
  return out;
}

/** A pack's principles resolved against the facets it is worn with, all in px: the solver's input. */
export function principlesFor(facets: Facets, pack: PackPrinciples): Principles {
  const { scale, materials } = facets;
  const sizes: Record<TextRole, number> = { ...scale.sizes, code: scale.sizes.body };
  return {
    scale: { unit: scale.unit, control: scale.control, sizes },
    minTarget: pack.minTarget,
    density: pack.density,
    gaps: pack.gaps,
    ranks: rankNumbers(pack.ranks),
    plate: {
      inset: cssBox(materials.plate.inset, scale),
      head: cssBox(materials.plate.head.inset, scale),
      gap: cssPx(materials.plate.gap, scale),
    },
  };
}
