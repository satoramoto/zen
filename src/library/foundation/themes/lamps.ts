// The lamp colours of the Push surface: one table, indexed as a Live Set indexes its track and clip
// colours, so a Set carries an index and never a colour (openspec: push-theme). The table is data
// a Set points into, not a theme facet: it is not part of `toCssVars()`. The device's root sets it
// as local custom properties (`lampVars()`), and parts read those and the contract only.
//
// The Push 3 manual prints no colour values. The seventy below are Live's track and clip colour
// chart, in its order (five rows of fourteen), so every value is added; they are the first thing
// to tune against a unit (docs/push.md).

/** Live's colour chart, row by row: index 0 is the top left, 69 the bottom right. */
export const LAMPS: readonly string[] = [
  // added: row 1
  '#ff94a6', '#ffa529', '#cc9927', '#f7f47c', '#bffb00', '#1aff2f', '#25ffa8', '#5cffe8', '#8bc5ff', '#5480e4', '#92a7ff', '#d86ce4', '#e553a0', '#ffffff',
  // added: row 2
  '#ff3636', '#f66c03', '#99724b', '#fff034', '#87ff67', '#3dc300', '#00bfaf', '#19e9ff', '#10a4ee', '#007dc0', '#886ce4', '#b677c6', '#ff39d4', '#d0d0d0',
  // added: row 3
  '#e2675a', '#ffa374', '#d3ad71', '#edffae', '#d2e498', '#bad074', '#9bc48d', '#d4fde1', '#cdf1f8', '#b9c1e3', '#cdbbe4', '#ae98e5', '#e5dce1', '#a9a9a9',
  // added: row 4
  '#c6928b', '#b78256', '#99836a', '#bfba69', '#a6be00', '#7db04d', '#88c2ba', '#9bb3c4', '#85a5c2', '#8393cc', '#a595b5', '#bf9fbe', '#bc7196', '#7b7b7b',
  // added: row 5
  '#af3333', '#a95131', '#724f41', '#dbc300', '#85961f', '#539f31', '#0a9c8e', '#236384', '#1a2f96', '#2f52a2', '#624bad', '#a34bad', '#cc2e6e', '#3c3c3c',
];

/** The colour of a lamp whose index the table does not have. */
export const LAMP_NEUTRAL = '#d0d0d0'; // added

/** The versions of a lamp colour the layouts call for. `lit` is the colour itself. */
export type LampShade = 'lit' | 'bright' | 'light' | 'dim' | 'dark';
export const LAMP_SHADES: readonly LampShade[] = ['lit', 'bright', 'light', 'dim', 'dark'];

/**
 * How each shade is made from the one colour: the share of the colour kept, and what the rest is
 * mixed with. `bright` and `light` go toward white (a higher velocity, a selected note); `dim` and
 * `dark` go toward the unlit pad (a muted pad, an available but idle one).
 */
export const LAMP_SHADE_RULES: Record<LampShade, { keep: number; toward: 'none' | 'white' | 'unlit' }> = {
  lit: { keep: 1, toward: 'none' },
  bright: { keep: 0.7, toward: 'white' }, // added
  light: { keep: 0.45, toward: 'white' }, // added
  dim: { keep: 0.45, toward: 'unlit' }, // added
  dark: { keep: 0.2, toward: 'unlit' }, // added
};

/** True when the table has `index`. */
export const isLampIndex = (index: unknown): index is number => typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < LAMPS.length;

/** The table's colour at `index`, or the neutral lamp colour. */
export const lampColour = (index: unknown): string => (isLampIndex(index) ? LAMPS[index] : LAMP_NEUTRAL);

/** The custom property a part reads for a lamp index: `var(--push-lamp-12)`, or the neutral one. */
export const lampVar = (index: unknown): string => (isLampIndex(index) ? `var(--push-lamp-${index})` : 'var(--push-lamp-neutral)');

/** Every lamp colour as a local custom property, for the device's root. */
export function lampVars(): Record<string, string> {
  const vars: Record<string, string> = { '--push-lamp-neutral': LAMP_NEUTRAL };
  LAMPS.forEach((hex, i) => (vars[`--push-lamp-${i}`] = hex));
  return vars;
}

/**
 * A shade of a colour as CSS, by the rules above. `colour` is any CSS colour (a lamp's variable or
 * one of the contract's meaning colours); `unlit` is the colour an unlit lamp shows (the pad well).
 */
export function lampShadeCss(colour: string, shade: LampShade, unlit = 'var(--surface-1)'): string {
  const { keep, toward } = LAMP_SHADE_RULES[shade];
  if (toward === 'none') return colour;
  return `color-mix(in oklab, ${colour} ${Math.round(keep * 100)}%, ${toward === 'white' ? 'white' : unlit})`;
}

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`;

/** A shade of a hex colour as a hex colour (a straight sRGB mix), for code with no CSS: tests, an export. */
export function lampShadeHex(hex: string, shade: LampShade, unlit = '#0f0f10'): string {
  const { keep, toward } = LAMP_SHADE_RULES[shade];
  if (toward === 'none') return hex.toLowerCase();
  const to = channels(toward === 'white' ? '#ffffff' : unlit);
  return toHex(channels(hex).map((c, i) => c * keep + to[i] * (1 - keep)));
}

/** Perceived lightness of a hex colour, 0 to 1 (relative luminance). */
export function lampLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
