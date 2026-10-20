import { Tree } from '../../../view/Tree';
import { barBeatView, type BarBeatModelProps } from './BarBeat.model';
import './BarBeat.css';

// The props, beat states and tree are framework-free, in the model; `BarBeat.svelte` draws the same tree.
export { beatState } from './BarBeat.model';
export type { BarBeatHue, BarBeatModelProps, BeatState } from './BarBeat.model';

export type BarBeatProps = BarBeatModelProps;

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
 *
 * **Tuning knobs.**
 * - `--yh-bar-beat-line`: the resting line's height (the `thickness` prop, or a parent such as a
 *   display); the downbeat is twice it, the lit beat and the bar three times.
 * - `--yh-bar-beat-count`: the number of cells, set inline from `beats`.
 */
export function BarBeat(props: BarBeatProps) {
  return <Tree tree={barBeatView(props)} />;
}

export default BarBeat;
