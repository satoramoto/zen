// BarBeat's model: its props, where each beat stands, and the tree both renderers draw from them
// (classes, `data-*`, ARIA and the inline custom properties). No framework: `BarBeat.tsx` (React)
// and `BarBeat.svelte` (Svelte) both pass `barBeatView` to their `Tree`. A readout: it binds no
// store and names no handler.
import { h, styleText, type Node } from '../../../view/Tree.model';

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

/** The tree BarBeat draws: the window `div` (its cell count and line inline) and one `span` cell per beat. */
export function barBeatView({ beat = 0, beats = 4, thickness }: BarBeatModelProps): Node {
  const count = Math.max(1, Math.floor(beats));
  return h(
    'div',
    {
      class: 'yh-bar-beat',
      'data-part': 'window',
      'data-material': 'screen',
      role: 'img',
      'aria-label': beat > 0 ? `Beat ${beat} of ${beats}` : 'Stopped',
      'data-playing': beat > 0 ? 'true' : undefined,
      style: styleText({ '--yh-bar-beat-count': String(count), '--yh-bar-beat-line': thickness }),
    },
    Array.from({ length: count }, (_, i) => {
      const state = beatState(i + 1, beat);
      return h('span', {
        class: `yh-bar-beat__segment yh-bar-beat__segment--${state}`,
        'data-part': 'cell',
        'data-state': state,
        'data-lit': state === 'current' ? 'true' : undefined,
        'data-downbeat': i === 0 ? 'true' : undefined,
        'aria-hidden': 'true',
      });
    }),
  );
}
