// BarBeat's model: its props, where each beat stands, and the view it draws (classes, `data-*`,
// ARIA and the inline custom properties). No framework: `BarBeat.tsx` (React) and
// `BarBeat.svelte` (Svelte) both render `barBeatView`.
import type { ElementView } from '../../../primitives/Text.model';

/** The playing section. Kept for older callers; it no longer changes the colour. */
export type BarBeatHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

export interface BarBeatModelProps {
  /** The current beat, 1-based; 0 when stopped (every segment at rest). */
  beat?: number;
  /** Beats in the bar: one segment each. */
  beats?: number;
  /**
   * @deprecated Sections take no hue: the bar is neutral ink in every section. Accepted
   * and ignored, so code built on the old API still compiles.
   */
  hue?: BarBeatHue;
  /**
   * The resting segment's thickness, any CSS length (`'4px'`, `'var(--space-2)'`); the lit beat
   * stays three times it. Default: the bar's own line, three quarters of `--space-1` (at least 2px).
   */
  thickness?: string;
}

export type BeatState = 'past' | 'current' | 'future';

/** Where beat `n` (1-based) stands while `beat` plays; stopped (`beat` ≤ 0), every beat is to come. */
export function beatState(n: number, beat: number): BeatState {
  if (beat <= 0) return 'future';
  if (n === beat) return 'current';
  return n < beat ? 'past' : 'future';
}

/** What a renderer draws: the window and one cell per beat. */
export interface BarBeatView {
  /** The window `div`. */
  root: ElementView;
  /** The window's inline custom properties, each value a string. */
  style: Record<string, string>;
  /** The cells, in order (`span`s). */
  cells: ElementView[];
}

/** The bar BarBeat draws from its props. */
export function barBeatView({ beat = 0, beats = 4, thickness }: BarBeatModelProps): BarBeatView {
  const count = Math.max(1, Math.floor(beats));
  const style: Record<string, string> = { '--yh-bar-beat-count': String(count) };
  if (thickness !== undefined) style['--yh-bar-beat-line'] = thickness;
  return {
    root: {
      className: 'yh-bar-beat',
      attrs: {
        'data-part': 'window',
        'data-material': 'screen',
        role: 'img',
        'aria-label': beat > 0 ? `Beat ${beat} of ${beats}` : 'Stopped',
        'data-playing': beat > 0 ? 'true' : undefined,
      },
    },
    style,
    cells: Array.from({ length: count }, (_, i) => {
      const state = beatState(i + 1, beat);
      return {
        className: `yh-bar-beat__segment yh-bar-beat__segment--${state}`,
        attrs: {
          'data-part': 'cell',
          'data-state': state,
          'data-lit': state === 'current' ? 'true' : undefined,
          'data-downbeat': i === 0 ? 'true' : undefined,
          'aria-hidden': 'true',
        },
      };
    }),
  };
}
