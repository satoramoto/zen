import type { CSSProperties } from 'react';
import { SECTION_STATE_COLOUR } from '../hues';
import './BarBeat.css';

/** The playing section. Kept for older callers; it no longer changes the colour. */
export type BarBeatHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill';

export interface BarBeatProps {
  /** The current beat, 1-based; 0 when stopped (every segment at rest). */
  beat?: number;
  /** Beats in the bar: one segment each. */
  beats?: number;
  /**
   * @deprecated Sections take no hue (`../hues`): the bar always wears the playing role. Accepted
   * and ignored, so code built on the old API still compiles.
   */
  hue?: BarBeatHue;
}

export type BeatState = 'past' | 'current' | 'future';

/** Where beat `n` (1-based) stands while `beat` plays; stopped (`beat` ≤ 0), every beat is to come. */
export function beatState(n: number, beat: number): BeatState {
  if (beat <= 0) return 'future';
  if (n === beat) return 'current';
  return n < beat ? 'past' : 'future';
}

/**
 * BarBeat: the display's beat bar, a segment per beat of the bar in the playing role.
 *
 * **Job.** Tell a player where they are in the bar without reading anything: past beats filled,
 * the current beat lit, beats to come at rest; stopped, every segment at rest. The parent passes
 * the moment; nothing here moves on its own. A readout, not a control: one spoken name
 * ("Beat 2 of 4" or "Stopped"), the segments hidden.
 *
 * **Changed.** *Colour meaning:* the four categorical hues belong to the four parts (`../hues`),
 * so the bar no longer wears a section's hue; what it shows is what is playing, so it takes the
 * `--selected` role in every section (`SECTION_STATE_COLOUR.playing`), and the section is named
 * by the SectionName beside it, not by colour. The resting segments use the strong border role
 * instead of a fixed dark grey, so they stay visible on light packs (color.md). *Contrast and
 * hierarchy:* the current beat differs by height as well as by glow, so it still stands out on
 * flat packs with no bloom and for readers who can't tell the colour (color.md). *Rhythm:*
 * segments are evenly spaced on the density's step and capped with the pack's pill radius; the
 * bar keeps the lit segment's height at every moment, so the line under it never jumps
 * (craft-details.md). It fills its container's width rather than a stage-specific measure.
 *
 * **Kept.** The segment states and their order, the 1-based beat with 0 for stopped, at least
 * one segment, and the single `img` with its spoken name.
 */
export function BarBeat({ beat = 0, beats = 4 }: BarBeatProps) {
  const count = Math.max(1, Math.floor(beats));
  const spoken = beat > 0 ? `Beat ${beat} of ${beats}` : 'Stopped';

  return (
    <div
      className="yh-bar-beat"
      role="img"
      aria-label={spoken}
      data-playing={beat > 0 || undefined}
      style={{ '--yh-bar-beat-count': count, '--yh-bar-beat-tone': SECTION_STATE_COLOUR.playing } as CSSProperties}
    >
      {Array.from({ length: count }, (_, i) => {
        const state = beatState(i + 1, beat);
        return <span key={i} className={`yh-bar-beat__segment yh-bar-beat__segment--${state}`} data-state={state} aria-hidden="true" />;
      })}
    </div>
  );
}

export default BarBeat;
