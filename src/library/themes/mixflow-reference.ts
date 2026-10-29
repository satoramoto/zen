// openflowfm/widgets src/theme/theme.ts, PRESETS[0] / DEFAULT_THEME, and resolve.ts.
// Kept as plain data so importing an old saved theme never reaches the old renderer or a CDN.
export interface MixflowTone { h: number; s: number; l: number }
export const MIXFLOW_ROLES = ['primary', 'signal', 'drums', 'bass', 'other', 'vocals', 'left', 'right', 'guitar', 'piano'] as const;
export type MixflowColorRole = (typeof MIXFLOW_ROLES)[number];
export const MIXFLOW_SOURCE_ROLES = ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'] as const;
export const MIXFLOW_DARK_SURFACES = {
  background: '#0a0a0b', panel: '#111113', rail: '#0e0e10', selected: '#1c1c20',
  border: '#262629', borderQuiet: '#232327', borderControl: '#2c2c31',
  text: '#ececed', ui: '#b7b7be', detail: '#8b8b93', caption: '#5e5e66', idle: '#3a3a41',
  control: '#151517', stats: '#121214', cell: '#18181b', cellMuted: '#131316', sunken: '#101012',
  focus: '#4a4a52', danger: '#d4544f', success: '#5fbfa8', info: '#4da6d9', caution: '#f0b23c', preview: '#b58fd6',
  band: '#0c0c0e', laneHead: '#191920', outside: '#16161bb3', manual: '#17171c', waveformBase: '#9ca3ad',
};
export interface MixflowDeckVariation { warmth: number; saturation: number; lightness: number; strength: number }
export interface MixflowSpectralStyle {
  mode: 'spectral' | 'deck';
  colors: Record<'low' | 'mid' | 'high', MixflowTone>;
  strength: number;
  waveform?: {
    layout: 'layers' | 'blend'; smooth: number; detail: number; headroom: number; fillOpacity: number;
    colorCurve: number; weights: readonly [number, number, number]; edge: number; edgeTint: 'white' | 'spectral';
    background?: string;
  };
}
export interface MixflowReferenceTheme {
  version: 1;
  colors: Record<MixflowColorRole, MixflowTone>;
  /** Early v1 documents may omit surfaces which were introduced later. */
  surfaces: Partial<Record<keyof typeof MIXFLOW_DARK_SURFACES, string>>;
  variation: MixflowDeckVariation;
  spectral?: MixflowSpectralStyle;
}
export const MIXFLOW_DEFAULT_VARIATION: MixflowDeckVariation = { warmth: 8, saturation: 0, lightness: 0, strength: 65 };
const tone = (h: number, s: number, l: number): MixflowTone => ({ h, s, l });
export const MIXFLOW_DEFAULT_SPECTRAL: MixflowSpectralStyle = {
  mode: 'spectral', strength: 100,
  colors: { low: tone(0, 155 / 245 * 100, 265 / 510 * 100), mid: tone(120, 155 / 245 * 100, 265 / 510 * 100), high: tone(240, 155 / 245 * 100, 265 / 510 * 100) },
};
const PALETTES = [
  { name: 'Current favorite', colors: {
    primary: tone(220, 6, 72), signal: tone(145, 55, 56), drums: tone(195, 59, 61), bass: tone(235, 56, 70),
    other: tone(280, 52, 68), vocals: tone(335, 56, 67), left: tone(122.93646240234375, 51.35546875, 62), right: tone(192.41558837890625, 86.60546875, 62.271484375),
  } },
  { name: 'Soft studio', colors: {
    primary: tone(215, 8, 78), signal: tone(145, 44, 59), drums: tone(190, 46, 67), bass: tone(230, 48, 73),
    other: tone(275, 40, 73), vocals: tone(330, 44, 72), left: tone(35, 35, 70), right: tone(85, 24, 69),
  } },
  { name: 'Night stage', colors: {
    primary: tone(220, 6, 72), signal: tone(145, 55, 56), drums: tone(195, 59, 61), bass: tone(235, 56, 70),
    other: tone(280, 52, 68), vocals: tone(335, 56, 67), left: tone(40, 28, 62), right: tone(90, 20, 61),
  } },
  { name: 'Porcelain', colors: {
    primary: tone(40, 5, 84), signal: tone(140, 40, 62), drums: tone(185, 34, 74), bass: tone(225, 37, 78),
    other: tone(270, 31, 78), vocals: tone(325, 36, 77), left: tone(30, 26, 76), right: tone(80, 20, 75),
  } },
];
export const MIXFLOW_PRESETS: { name: string; theme: MixflowReferenceTheme }[] = PALETTES.map((p) => ({
  name: p.name,
  theme: { version: 1, colors: { ...p.colors, guitar: tone(25, 48, 66), piano: tone(65, 42, 68) },
    surfaces: { ...MIXFLOW_DARK_SURFACES }, variation: { ...MIXFLOW_DEFAULT_VARIATION }, spectral: MIXFLOW_DEFAULT_SPECTRAL },
}));
export const MIXFLOW_DEFAULT_THEME = MIXFLOW_PRESETS[0].theme;

export const mixflowColor = ({ h, s, l }: MixflowTone) => `hsl(${h} ${s}% ${l}%)`;
export const mixflowOnPrimary = (theme: MixflowReferenceTheme) => theme.colors.primary.l >= 55 ? '#000000' : '#ffffff';
/** A nearest solid colour for native colour inputs only. Paint and skin JSON retain source HSL. */
export function mixflowHex({ h, s, l }: MixflowTone): string {
  const lightness = l / 100, a = s / 100 * Math.min(lightness, 1 - lightness);
  return `#${[0, 8, 4].map((n) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
  }).join('')}`;
}
/** The second deck in each family moves towards 30° by warmth, exactly as the source resolver. */
export function mixflowDeckTones(theme: MixflowReferenceTheme): readonly [MixflowTone, MixflowTone, MixflowTone, MixflowTone] {
  const pair = (side: 'left' | 'right'): readonly [MixflowTone, MixflowTone] => {
    const t = theme.colors[side], v = theme.variation;
    const direction = Math.sign(((30 - t.h + 540) % 360) - 180);
    return [t, { h: ((t.h + direction * v.warmth) % 360 + 360) % 360,
      s: Math.max(0, Math.min(100, t.s + v.saturation)), l: Math.max(0, Math.min(100, t.l + v.lightness)) }];
  };
  return [...pair('left'), ...pair('right')];
}
