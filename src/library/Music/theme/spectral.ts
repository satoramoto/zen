// Pure widgets mirror. A structural tone keeps this module independent of a theme adapter/renderer.
type Tone = { h: number; s: number; l: number };

export const SPECTRAL_NAMES = { low: 'Low frequencies', mid: 'Mid frequencies', high: 'High frequencies' } as const;
export type SpectralBand = keyof typeof SPECTRAL_NAMES;
export const SPECTRAL_BANDS = Object.keys(SPECTRAL_NAMES) as SpectralBand[];
export type SpectralEnergy = readonly [number, number, number];
/** Measured input remains mean-square band energy; treatments may use its RMS amplitude. */
export interface WaveformTreatment {
  layout: 'layers' | 'blend';
  smooth: number;
  detail: number;
  headroom: number;
  fillOpacity: number;
  colorCurve: number;
  weights: SpectralEnergy;
  edge: number;
  edgeTint: 'white' | 'spectral';
  background?: string;
}
export interface SpectralStyle {
  mode: 'spectral' | 'deck';
  colors: Record<SpectralBand, Tone>;
  strength: number;
  waveform?: WaveformTreatment;
}
export const PRISM_SPECTRAL: SpectralStyle = {
  mode: 'spectral', strength: 100,
  colors: { low: { h: 0, s: 100, l: 50 }, mid: { h: 120, s: 100, l: 46 }, high: { h: 240, s: 100, l: 46 } },
  waveform: { layout: 'blend', smooth: .35, detail: 2, headroom: .86, fillOpacity: 1, colorCurve: 2.114115,
    weights: [.85, 1, 1.8], edge: .8788055, edgeTint: 'white' },
};
export const AURORA_SPECTRAL: SpectralStyle = {
  mode: 'spectral', strength: 100,
  colors: { low: { h: 275, s: 100, l: 30 }, mid: { h: 95, s: 100, l: 25 }, high: { h: 185, s: 100, l: 19 } },
  waveform: { layout: 'blend', smooth: .35, detail: 2, headroom: .86, fillOpacity: .88, colorCurve: 2.3,
    weights: [.85, 1, 1.8], edge: .88, edgeTint: 'spectral', background: '#090913' },
};
export const EMBER_SPECTRAL: SpectralStyle = {
  mode: 'spectral', strength: 100,
  colors: { low: { h: 22, s: 100, l: 27 }, mid: { h: 325, s: 100, l: 23 }, high: { h: 225, s: 100, l: 28 } },
  waveform: { layout: 'blend', smooth: .35, detail: 2, headroom: .86, fillOpacity: .88, colorCurve: 2.3,
    weights: [.85, 1, 1.8], edge: .9, edgeTint: 'spectral', background: '#090913' },
};
const tone = (h: number, s: number, l: number): Tone => ({ h, s, l });
export const SPECTRAL_PRESETS: { name: string; style: SpectralStyle }[] = [
  { name: 'RGB', style: { mode: 'spectral', strength: 100, colors: { low: tone(0, 155 / 245 * 100, 265 / 510 * 100), mid: tone(120, 155 / 245 * 100, 265 / 510 * 100), high: tone(240, 155 / 245 * 100, 265 / 510 * 100) } } },
  { name: 'Prism', style: PRISM_SPECTRAL },
  { name: 'Aurora', style: AURORA_SPECTRAL },
  { name: 'Ember', style: EMBER_SPECTRAL },
  { name: 'Warm', style: { mode: 'spectral', strength: 85, colors: { low: tone(8, 62, 62), mid: tone(40, 52, 67), high: tone(65, 28, 83) } } },
  { name: 'Ice', style: { mode: 'spectral', strength: 85, colors: { low: tone(235, 46, 58), mid: tone(197, 54, 66), high: tone(180, 24, 86) } } },
];
export const DEFAULT_SPECTRAL = SPECTRAL_PRESETS[0].style;
export const isSpectralBand = (role: string): role is SpectralBand => SPECTRAL_BANDS.includes(role as SpectralBand);
export function isSpectralStyle(value: unknown): value is SpectralStyle {
  if (!value || typeof value !== 'object') return false;
  const s = value as SpectralStyle;
  return (s.mode === 'spectral' || s.mode === 'deck') && Number.isFinite(s.strength) && s.strength >= 0 && s.strength <= 100
    && (s.waveform === undefined || isWaveformTreatment(s.waveform)) && !!s.colors && SPECTRAL_BANDS.every(b => {
      const t = s.colors[b];
      return t && Number.isFinite(t.h) && t.h >= 0 && t.h < 360 && Number.isFinite(t.s) && t.s >= 0 && t.s <= 100 && Number.isFinite(t.l) && t.l >= 0 && t.l <= 100;
    });
}
export function editSpectral(style: SpectralStyle, band: SpectralBand, key: keyof Tone, value: number): SpectralStyle {
  if (!Number.isFinite(value)) return style;
  const n = key === 'h' ? ((value % 360) + 360) % 360 : Math.max(0, Math.min(100, value));
  return { ...style, colors: { ...style.colors, [band]: { ...style.colors[band], [key]: n } } };
}
function rgb({ h, s, l }: Tone): number[] {
  const a = s / 100 * Math.min(l / 100, 1 - l / 100);
  return [0, 8, 4].map(n => { const k = (n + h / 30) % 12; return 255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); });
}
/** Prepare paint once per theme change; analysis supplies energy, never baked colours. */
export function spectralPainter(style: SpectralStyle, neutral: string, silence: string, curve = .5) {
  const tones = SPECTRAL_BANDS.map(b => rgb(style.colors[b]));
  const floor = [0, 1, 2].map(c => Math.min(...tones.map(t => t[c])));
  const gray = [1, 3, 5].map(i => parseInt(neutral.slice(i, i + 2), 16));
  return (energy: SpectralEnergy): string => {
    const maximum = Math.max(...energy);
    if (maximum < .00001) return silence;
    const weights = energy.map(e => Math.pow(Math.max(0, e) / maximum, curve));
    const channels = floor.map((base, c) => {
      const ink = Math.min(255, base + tones.reduce((sum, t, b) => sum + weights[b] * (t[c] - base), 0));
      return Math.round(gray[c] + (ink - gray[c]) * style.strength / 100);
    });
    return `rgb(${channels.join(', ')})`;
  };
}
function isWaveformTreatment(value: unknown): value is WaveformTreatment {
  if (!value || typeof value !== 'object') return false;
  const w = value as WaveformTreatment;
  const within = (v: number, lo: number, hi: number) => Number.isFinite(v) && v >= lo && v <= hi;
  return (w.layout === 'layers' || w.layout === 'blend') && (w.edgeTint === 'white' || w.edgeTint === 'spectral')
    && (w.background === undefined || (typeof w.background === 'string' && /^#[0-9a-f]{6}$/i.test(w.background)))
    && within(w.smooth, 0, 1) && within(w.detail, .5, 2) && within(w.headroom, .4, .95)
    && within(w.fillOpacity, .1, 1) && within(w.colorCurve, .25, 2.5) && within(w.edge, 0, 1)
    && Array.isArray(w.weights) && w.weights.length === 3 && w.weights.every(v => within(v, .25, 3));
}
export const amplitudeEnergy = (energy: SpectralEnergy): SpectralEnergy =>
  [Math.sqrt(Math.max(0, energy[0])), Math.sqrt(Math.max(0, energy[1])), Math.sqrt(Math.max(0, energy[2]))];
export function waveformPainter(style: SpectralStyle, neutral: string, silence: string) {
  if (style.mode === 'deck') return (energy: SpectralEnergy) => Math.max(...energy) < .00001 ? silence : neutral;
  const w = style.waveform;
  const paint = spectralPainter(style, neutral, silence, w?.colorCurve);
  return w ? (energy: SpectralEnergy) => {
    const e = amplitudeEnergy(energy);
    return paint([e[0] * w.weights[0], e[1] * w.weights[1], e[2] * w.weights[2]]);
  } : paint;
}
