// DOM-side theme adapter. Pure spectral maths stays in ../theme/spectral (no renderer imports).
import { DEFAULT_SPECTRAL, SPECTRAL_BANDS, SPECTRAL_PRESETS, isSpectralStyle, type SpectralStyle } from '../theme/spectral';

/** Resolve nested CSS variables against this canvas, including var() fallbacks and currentColor. */
export function resolveWaveformColor(ink: string, css: CSSStyleDeclaration): string {
  const expand = (value: string, depth: number): string => {
    if (depth > 16) return '';
    let result = '', start = 0;
    while (start < value.length) {
      const at = value.indexOf('var(', start);
      if (at < 0) { result += value.slice(start); break; }
      result += value.slice(start, at);
      let end = at + 4, nesting = 1;
      for (; end < value.length && nesting; end++) {
        if (value[end] === '(') nesting++;
        if (value[end] === ')') nesting--;
      }
      if (nesting) return value;
      const body = value.slice(at + 4, end - 1), comma = body.indexOf(',');
      const name = (comma < 0 ? body : body.slice(0, comma)).trim();
      const fallback = comma < 0 ? '' : body.slice(comma + 1).trim();
      result += expand(css.getPropertyValue(name).trim() || fallback, depth + 1);
      start = end;
    }
    return result;
  };
  return expand(ink, 0).replace(/\bcurrentColor\b/gi, css.color) || css.color;
}

const probes = new WeakMap<Document, CanvasRenderingContext2D>();
/** Canvas accepts modern CSS colours; a one-pixel probe normalizes them for the source RGB maths. */
function rgbOf(document: Document, ink: string): [number, number, number] {
  let g = probes.get(document);
  if (!g) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    g = canvas.getContext('2d', { willReadFrequently: true })!;
    if (g) probes.set(document, g);
  }
  if (!g) return [0, 0, 0];
  g.clearRect(0, 0, 1, 1);
  g.fillStyle = '#000000';
  g.fillStyle = ink;
  g.fillRect(0, 0, 1, 1);
  const [r, green, b] = g.getImageData(0, 0, 1, 1).data;
  return [r, green, b];
}

function toneOf([r, g, b]: readonly number[]): SpectralStyle['colors']['low'] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, l = (max + min) / 2;
  const h = !delta ? 0 : max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return { h: ((h * 60) + 360) % 360, s: delta ? delta / (1 - Math.abs(2 * l - 1)) * 100 : 0, l: l * 100 };
}

/** Source HSL tokens retain fractional channels until spectralPainter's final RGB rounding. */
function cssTone(ink: string, document: Document): SpectralStyle['colors']['low'] {
  const match = /^hsla?\(\s*([-+\d.e]+)(deg)?[\s,]+([-+\d.e]+)%[\s,]+([-+\d.e]+)%(?:\s*[,/].*)?\s*\)$/i.exec(ink);
  if (match) return { h: ((Number(match[1]) % 360) + 360) % 360, s: Number(match[3]), l: Number(match[4]) };
  return toneOf(rgbOf(document, ink));
}

export interface WaveformTheme { spectral: SpectralStyle; neutral: string; silence: string }

/** Read the active scope at paint time, never at module load and never from a React context. */
export function waveformTheme(element: HTMLCanvasElement, css = getComputedStyle(element)): WaveformTheme {
  const token = (...names: string[]) => names.map(name => css.getPropertyValue(name).trim()).find(Boolean);
  const serialized = token('--music-spectral-style');
  let spectral: SpectralStyle | undefined;
  if (serialized) {
    try { const value: unknown = JSON.parse(serialized); if (isSpectralStyle(value)) spectral = value; } catch { /* Incomplete edits keep the scope's normal tokens. */ }
  }
  const preset = token('--music-spectral-preset');
  spectral ??= SPECTRAL_PRESETS.find(item => item.name.toLowerCase() === preset?.toLowerCase())?.style;
  const completeStyle = !!spectral;
  if (!spectral) {
    const colors = { ...DEFAULT_SPECTRAL.colors };
    for (const band of SPECTRAL_BANDS) {
      const ink = token(`--instrument-spectral-${band}`, `--spectral-${band}`);
      if (ink) colors[band] = cssTone(resolveWaveformColor(ink, css), element.ownerDocument);
    }
    spectral = { ...DEFAULT_SPECTRAL, colors };
  }
  // Prefer canonical tokens: an inherited alias may have resolved on an outer vocabulary boundary
  // before an inner ThemeScope overrides the instrument token.
  const mode = token('--instrument-spectral-mode', '--music-spectral-mode', '--spectral-mode');
  const strength = token('--instrument-spectral-strength', '--music-spectral-strength', '--spectral-strength');
  if (!completeStyle && (mode === 'deck' || mode === 'spectral')) spectral = { ...spectral, mode };
  if (!completeStyle && strength && Number.isFinite(Number(strength))) spectral = { ...spectral, strength: Math.max(0, Math.min(100, Number(strength))) };
  const neutralInk = token('--instrument-waveform-base', '--waveform-base', '--text-2') || css.color;
  const neutral = '#' + rgbOf(element.ownerDocument, resolveWaveformColor(neutralInk, css)).map(n => n.toString(16).padStart(2, '0')).join('');
  const silence = resolveWaveformColor(token('--instrument-idle', '--idle', '--text-3') || css.color, css);
  return { spectral, neutral, silence };
}

/** Source-compatible convenience export for canvas hosts at the mirrored music path. */
export { spectralPainter, waveformPainter, amplitudeEnergy } from '../theme/spectral';
export type { SpectralEnergy, SpectralStyle, WaveformTreatment } from '../theme/spectral';
