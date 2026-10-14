// Colour maths every harness shares when it maps a zen palette onto what its surfaces can draw:
// parsing a palette value to sRGB, OKLCH hue and chroma (to find "the pack's blue"), mixing, and
// keeping two colours apart by identity. Pure functions on #rrggbb strings; nothing here is
// copied into a plugin.

export type Rgb = readonly [number, number, number];

/** A palette value (#rgb, #rrggbb, rgb() or rgba()) as 0–255 channels; undefined for anything else. */
export function parseColor(value: string): Rgb | undefined {
  const v = value.trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1]!.length === 3 ? [...hex[1]!].map((x) => x + x).join('') : hex[1]!;
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as unknown as Rgb;
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) return [rgb[1], rgb[2], rgb[3]].map((x) => Math.max(0, Math.min(255, Math.round(Number(x))))) as unknown as Rgb;
  return undefined;
}

/** Channels as #rrggbb. */
export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')}`;
}

/** A palette value as #rrggbb; throws for a value with no single colour (a gradient, a var()). */
export function hex(value: string): string {
  const rgb = parseColor(value);
  if (!rgb) throw new Error(`Not a plain colour: ${value}`);
  return toHex(rgb);
}

const linear = (c: number) => {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};

/** OKLab [L, a, b] of a colour. */
export function oklab(value: string): [number, number, number] {
  const [r, g, b] = (parseColor(value) ?? [0, 0, 0]).map(linear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLCH chroma: 0 for a grey, about 0.1 and up for a colour that reads as a hue. */
export function chroma(value: string): number {
  const [, a, b] = oklab(value);
  return Math.hypot(a, b);
}

/** OKLCH hue in degrees, 0–360. */
export function hue(value: string): number {
  const [, a, b] = oklab(value);
  return ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
}

/** OKLCH [lightness, chroma, hue in degrees]. */
export function oklch(value: string): [number, number, number] {
  return [oklab(value)[0], chroma(value), hue(value)];
}

/** An OKLCH colour as #rrggbb, its chroma lowered until it fits sRGB. */
export function fromOklch(l: number, c: number, h: number): string {
  const rad = (h * Math.PI) / 180;
  for (let k = c; k >= 0; k -= 0.005) {
    const [a, b] = [k * Math.cos(rad), k * Math.sin(rad)];
    const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const lin = [
      4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
      -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
      -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
    ];
    if (lin.every((x) => x >= -1e-4 && x <= 1 + 1e-4)) {
      const srgb = lin.map((x) => {
        const v = Math.max(0, Math.min(1, x));
        return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
      });
      return toHex(srgb as unknown as Rgb);
    }
  }
  return toHex([l * 255, l * 255, l * 255]);
}

/** The angle between two hues, 0–180. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** `a` mixed towards `b` by `t` (0 is `a`, 1 is `b`), in sRGB, as #rrggbb. */
export function mix(a: string, b: string, t: number): string {
  const [p, q] = [parseColor(a)!, parseColor(b)!];
  return toHex([0, 1, 2].map((i) => p[i]! + (q[i]! - p[i]!) * t) as unknown as Rgb);
}

/**
 * `value` as #rrggbb, or, when that is one of `taken`, the nearest colour that isn't: its blue
 * channel stepped one unit up, then down, then two, and so on. The same colour to the eye, a
 * different one by identity: a harness that tells meanings apart by their value (a status by its
 * hex) keeps each meaning's value its own this way.
 */
export function apart(value: string, taken: ReadonlySet<string>): string {
  const [r, g, b] = parseColor(value)!;
  for (let step = 0; step <= 510; step++) {
    const offset = step === 0 ? 0 : step % 2 ? (step + 1) / 2 : -step / 2;
    const c = b + offset;
    if (c < 0 || c > 255) continue;
    const out = toHex([r, g, c]);
    if (!taken.has(out)) return out;
  }
  throw new Error(`No colour near ${value} is free`);
}
