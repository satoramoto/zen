import { amplitudeEnergy, spectralPainter, type SpectralEnergy } from '../theme/spectral';
import { levelsOf, packedOf, type Peak, type Steps } from './levels';
import { densityFor, edgesOf, pathOf, samplesFrom, type Edges } from './outline';
import { paintSpectralOutline, type SpectralOutlineStyle } from './spectralOutline';
import { resolveWaveformColor, waveformTheme } from './spectralPainter';
import type { WaveformProps } from './Waveform.model';

export type WaveformParams = Omit<WaveformProps, 'className' | 'label'>;
const themeTokens = [
  'color', '--music-spectral-style', '--music-spectral-preset', '--music-spectral-mode', '--music-spectral-strength', '--instrument-spectral-mode', '--instrument-spectral-strength', '--spectral-mode', '--spectral-strength',
  '--instrument-spectral-low', '--instrument-spectral-mid', '--instrument-spectral-high', '--spectral-low', '--spectral-mid', '--spectral-high',
  '--instrument-waveform-base', '--waveform-base', '--instrument-idle', '--idle', '--text-2', '--text-3',
];
const ladders = new WeakMap<object, readonly Steps[]>();
const laddered = (peaks: WaveformParams['peaks']): readonly Steps[] => {
  let levels = ladders.get(peaks);
  if (!levels) {
    levels = Array.isArray(peaks) && peaks.length && peaks[0] instanceof Float32Array
      ? peaks as readonly Steps[] : levelsOf(peaks instanceof Float32Array ? peaks : packedOf(peaks as readonly Peak[]));
    ladders.set(peaks, levels);
  }
  return levels;
};

/** Both renderers bind the same store; a paint-only change never repacks or re-analyses the audio. */
export function bindWaveform(node: HTMLElement, initial: WaveformParams) {
  const canvas = node as HTMLCanvasElement;
  const view = canvas.ownerDocument.defaultView!;
  let params = initial, levels = laddered(params.peaks), reading = params.peaks;
  let pending = 0, destroyed = false;
  let geometry: { key: string; levels: readonly Steps[]; samples: WaveformParams['samples']; edges: Edges } | undefined;
  let energy: { source: readonly SpectralEnergy[]; rms: readonly SpectralEnergy[] } | undefined;
  let themeKey = '', theme: ReturnType<typeof waveformTheme> | undefined;
  let colorCache: { source: readonly SpectralEnergy[]; theme: string; colors: readonly string[] } | undefined;
  let lastPaintKey: string | undefined;
  let colorSource = params.colors;
  // Scan the caller's (possibly long) colour array only when it changes, not on every scroll RAF.
  // Computed custom properties already resolve their own var() dependencies; fallback refs in the
  // supplied colours are included too. `color` above covers currentColor and unresolved ink.
  const colorProperties = () => [...new Set((params.colors ?? []).flatMap(ink =>
    [...ink.matchAll(/var\(\s*(--[\w-]+)/g)].map(match => match[1])))];
  let colorKeys = colorProperties();
  const themeKeyOf = (css: CSSStyleDeclaration) => themeTokens.map(name => css.getPropertyValue(name)).join('|');
  const paintKeyOf = (css: CSSStyleDeclaration, nextThemeKey = themeKeyOf(css)) => JSON.stringify([
    nextThemeKey, resolveWaveformColor(params.ink, css), colorKeys.map(name => css.getPropertyValue(name)),
  ]);

  const paint = () => {
    const box = canvas.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;
    const dpr = view.devicePixelRatio || 1;
    const across = Math.round(box.width * dpr), down = Math.round(box.height * dpr);
    // Assigning even the same backing-store size clears/reallocates it. Never do it per frame.
    if (canvas.width !== across) canvas.width = across;
    if (canvas.height !== down) canvas.height = down;
    const g = canvas.getContext('2d');
    if (!g) return;
    const css = view.getComputedStyle(canvas);
    const nextThemeKey = themeKeyOf(css);
    // Remember even an empty reading's paint inputs, so ancestor transform writes leave it idle.
    lastPaintKey = paintKeyOf(css, nextThemeKey);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, box.width, box.height);
    const { from = 0, to = 1, ink, spectrum, samples, presentation } = params;
    // An empty reading/window is a clear canvas, not a path with NaN coordinates.
    if (!(to > from) || !levels[0]?.length) return;
    // Only invalidate the paint cache when a scoped paint token actually changes.
    if (!theme || nextThemeKey !== themeKey) { theme = waveformTheme(canvas, css); themeKey = nextThemeKey; }
    const treatment = theme.spectral.mode === 'spectral' ? theme.spectral.waveform : undefined;
    const activePresentation: SpectralOutlineStyle | undefined = presentation ?? (treatment ? { ...treatment, spectral: theme.spectral } : undefined);
    const smooth = params.smooth ?? treatment?.smooth ?? 1;
    const ask = {
      from, to, width: box.width, height: box.height,
      density: params.density ?? densityFor(params.visibleShare ?? to - from) * (treatment?.detail ?? 1),
      smooth, headroom: params.headroom ?? treatment?.headroom ?? .86,
    };
    const key = JSON.stringify(ask);
    if (!geometry || geometry.key !== key || geometry.levels !== levels || geometry.samples !== samples) {
      const length = samples?.[0]?.length ?? 0;
      const fine = length > 0 && (to - from) * (levels[0].length >> 1) < box.width * ask.density;
      geometry = { key, levels, samples, edges: fine ? samplesFrom(samples!, { ...ask, length }) : edgesOf(levels, ask) };
    }
    let activeSpectrum = spectrum;
    if (!presentation && treatment && spectrum) {
      if (energy?.source !== spectrum) energy = { source: spectrum, rms: spectrum.map(amplitudeEnergy) };
      activeSpectrum = energy.rms;
    }
    if (activePresentation && activeSpectrum?.length) {
      paintSpectralOutline(g, geometry.edges, activeSpectrum, { ...ask, neutral: theme.neutral, silence: theme.silence }, activePresentation);
      return;
    }
    let colors = spectrum ? undefined : params.colors;
    if (spectrum && theme.spectral.mode !== 'deck') {
      if (!colorCache || colorCache.source !== spectrum || colorCache.theme !== themeKey) {
        colorCache = { source: spectrum, theme: themeKey, colors: spectrum.map(spectralPainter(theme.spectral, theme.neutral, theme.silence)) };
      }
      colors = colorCache.colors;
    }
    g.fillStyle = resolveWaveformColor(ink, css);
    if (colors?.length) {
      const gradient = g.createLinearGradient(0, 0, box.width, 0);
      const first = Math.max(0, Math.floor(from * colors.length)), last = Math.min(colors.length - 1, Math.ceil(to * colors.length));
      for (let i = first; i <= last; i++) {
        const at = Math.max(0, Math.min(1, ((i + .5) / colors.length - from) / (to - from)));
        gradient.addColorStop(at, resolveWaveformColor(colors[i], css));
      }
      g.fillStyle = gradient;
    }
    g.fill(pathOf(geometry.edges, smooth));
  };
  const schedule = () => {
    if (destroyed || pending) return;
    pending = view.requestAnimationFrame(() => { pending = 0; if (!destroyed) paint(); });
  };
  const paintChanged = () => {
    if (destroyed || pending) return;
    // FrameWaveLane writes strip.style.transform every RAF, even at a fixed clock. It translates
    // this cached canvas; an ancestor mutation alone is not a reason to clear/fill it again.
    if (paintKeyOf(view.getComputedStyle(canvas)) !== lastPaintKey) schedule();
  };
  const resize = new ResizeObserver(schedule);
  resize.observe(canvas);
  // Observe only the canvas's ancestry, not other widgets' high-rate DOM/frame updates.
  const scope = new MutationObserver(paintChanged);
  scope.observe(canvas, { attributes: true, attributeFilter: ['style', 'class'] });
  for (let ancestor = canvas.parentElement; ancestor; ancestor = ancestor.parentElement) scope.observe(ancestor, { attributes: true });
  const styles = new MutationObserver(paintChanged);
  styles.observe(canvas.ownerDocument.head, { subtree: true, childList: true, characterData: true, attributes: true });
  const media = view.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', paintChanged);
  view.addEventListener('resize', schedule);
  schedule();
  return {
    update(next: WaveformParams) {
      params = next;
      if (next.colors !== colorSource) { colorSource = next.colors; colorKeys = colorProperties(); }
      if (next.peaks !== reading) { reading = next.peaks; levels = laddered(next.peaks); }
      schedule();
    },
    destroy() {
      destroyed = true;
      resize.disconnect(); scope.disconnect(); styles.disconnect();
      media.removeEventListener('change', paintChanged);
      view.removeEventListener('resize', schedule);
      if (pending) view.cancelAnimationFrame(pending);
      pending = 0;
      geometry = undefined; energy = undefined; colorCache = undefined;
    },
  };
}
