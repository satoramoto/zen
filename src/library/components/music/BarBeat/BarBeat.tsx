import type { CSSProperties } from 'react';
import './BarBeat.css';

/** The playing section. Kept for older callers; it no longer changes the colour. */
export type BarBeatHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

export interface BarBeatProps {
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

/**
 * BarBeat: the display's beat cells, one per beat of the bar.
 *
 * **Job.** Tell a player where they are in the bar without reading anything: past beats filled,
 * the current beat lit, beats to come at rest; stopped, every cell at rest. The parent passes
 * the moment; nothing here moves on its own. A readout, not a control: one spoken name
 * ("Beat 2 of 4" or "Stopped"), the cells hidden.
 *
 * **Changed.** *Colour meaning:* a solid `--selected` fill means "sounding" and belongs to the
 * playing section's block, so the beat no longer wears it: the lit beat is primary ink
 * (`--text-1`), past beats the muted ink (`--text-3`, history, not "playing"), beats to come a
 * faint tint of the text on the ground (16% of `--text-1` in `--surface-0`), never the strong
 * border, which on some packs is as dark as the text (color.md). This is what the Display draws,
 * so the hero no longer overrides it. No section hue. *Hierarchy:* the current beat
 * differs by height (three times the line) as well as by ink, so it reads on flat packs and for
 * readers who can't tell the ink apart; beat 1 rests at twice the line, so the bar shows where it
 * starts. *Rhythm:* the cells sit `--space-3` apart, wide enough to count as four from a distance,
 * capped with the pack's pill radius; the bar keeps the lit height at every moment, so the line
 * under it never jumps (craft-details.md). An optional `thickness` sets the resting line for
 * regions read from across a room. It fills its container's width. *Materials:* the bar is a
 * `screen` window (`data-part="window"`; none of its own on a screen already, as in the Display)
 * and each beat a `cell`; the current one is lit (`data-lit`, `--lit` in `--text-1`) and wears
 * the theme's `--mat-lit-glow`, which flat themes leave at nothing.
 *
 * **Kept.** The segment states and their order, the 1-based beat with 0 for stopped, at least
 * one segment, and the single `img` with its spoken name.
 */
export function BarBeat({ beat = 0, beats = 4, thickness }: BarBeatProps) {
  const count = Math.max(1, Math.floor(beats));
  const spoken = beat > 0 ? `Beat ${beat} of ${beats}` : 'Stopped';

  return (
    <div
      className="yh-bar-beat"
      data-part="window"
      data-material="screen"
      role="img"
      aria-label={spoken}
      data-playing={beat > 0 || undefined}
      style={
        {
          '--yh-bar-beat-count': count,
          ...(thickness !== undefined && { '--yh-bar-beat-line': thickness }),
        } as CSSProperties
      }
    >
      {Array.from({ length: count }, (_, i) => {
        const state = beatState(i + 1, beat);
        return (
          <span
            key={i}
            className={`yh-bar-beat__segment yh-bar-beat__segment--${state}`}
            data-part="cell"
            data-state={state}
            data-lit={state === 'current' || undefined}
            data-downbeat={i === 0 || undefined}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

export default BarBeat;
