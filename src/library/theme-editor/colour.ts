// Colour maths for the editor: hex ⇄ HSL (the editor's hue, saturation and lightness fields, as
// mix's editor had), WCAG contrast and OKLab distance for the warnings. No React.
import type { Mode, Palette, Scheme } from '../contract';

export interface Hsl {
  /** 0–359. */
  h: number;
  /** 0–100. */
  s: number;
  /** 0–100. */
  l: number;
}

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);

const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const hex2 = (n: number) =>
  Math.round(Math.max(0, Math.min(1, n)) * 255)
    .toString(16)
    .padStart(2, '0');

/** `#rrggbb` to hue, saturation and lightness, rounded to whole numbers. */
export function hexToHsl(hex: string): Hsl {
  const [r, g, b] = rgbOf(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Hue, saturation and lightness (clamped, hue wrapped) to `#rrggbb`. */
export function hslToHex({ h, s, l }: Hsl): string {
  const hh = (((h % 360) + 360) % 360) / 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + hh * 12) % 12;
    return ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return `#${hex2(f(0))}${hex2(f(8))}${hex2(f(4))}`;
}

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const [r, g, b] = rgbOf(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG 2 contrast ratio between two `#rrggbb` colours (1–21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const oklab = (hex: string) => {
  const [r, g, b] = rgbOf(hex).map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

/** OKLab distance between two `#rrggbb` colours. */
export function distance(a: string, b: string): number {
  const [p, q] = [oklab(a), oklab(b)];
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/** The least OKLab distance at which two meaning colours read as different (library.test.tsx's). */
export const DISTINCT = 0.12;
/** WCAG AA for body text. */
export const AA = 4.5;

/** Text and fills that must read: [name, ink, ground]. */
const readPairs = (p: Scheme): [string, string, string][] => [
  ['Primary text on the ground', p.text[0], p.surface[0]],
  ['Secondary text on the ground', p.text[1], p.surface[0]],
  ['Action text', p.actionText, p.action],
  ['Selected text', p.selectedText, p.selected],
  ['Success text', p.successText, p.success],
  ['Warning text', p.warningText, p.warning],
  ['Danger text', p.dangerText, p.danger],
  ['Role 1 text', p.roleText[0], p.roles[0]],
  ['Role 2 text', p.roleText[1], p.roles[1]],
];

/** The colours that each carry a meaning, which must stay apart. */
const meaningColours = (p: Scheme): [string, string][] => [
  ...p.hues.map((hue, i): [string, string] => [`Hue ${i + 1}`, hue]),
  ['Success', p.success],
  ['Warning', p.warning],
  ['Danger', p.danger],
  ['Role 1', p.roles[0]],
  ['Role 2', p.roles[1]],
  ['Accent', p.accent],
  ['Selected', p.selected],
];

/**
 * What would make a palette hard to read or hard to tell apart, in one mode, in plain words: text
 * below WCAG AA on its fill, and meaning colours closer than `DISTINCT` (the rules zen's own packs
 * are held to). Colours that aren't `#rrggbb` are skipped. Empty when all is well.
 */
export function paletteWarnings(palette: Palette, mode: Mode): string[] {
  const p = palette[mode];
  const out: string[] = [];
  for (const [name, ink, ground] of readPairs(p)) {
    if (!isHex(ink) || !isHex(ground)) continue;
    const c = contrast(ink, ground);
    if (c < AA) out.push(`${name} is ${c.toFixed(1)}:1; AA needs ${AA}:1.`);
  }
  const roles = meaningColours(p).filter(([, v]) => isHex(v));
  for (const [i, [a, x]] of roles.entries())
    for (const [b, y] of roles.slice(i + 1)) if (distance(x, y) < DISTINCT) out.push(`${a} and ${b} read alike.`);
  return out;
}
