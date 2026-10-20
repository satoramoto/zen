import { Tree } from '../../view/Tree';
import { metronomePopoverHandlers, metronomePopoverView, type MetronomePopoverModelProps } from './MetronomePopover.model';
import '../../primitives/Text.css';
import './MetronomePopover.css';

// The props, the popover and its keys are framework-free, in the model and the `dismiss` store; this
// file and `MetronomePopover.svelte` only hand the model's tree to their `Tree`.
export type { MetronomePopoverModelProps } from './MetronomePopover.model';
export type MetronomePopoverProps = MetronomePopoverModelProps;

/**
 * MetronomePopover: the metronome's settings, opened from the app bar's Metronome ▾.
 *
 * **Job.** Set the click once, before or between songs: on or off, how loud, and whether the
 * first beat rings a bell. A player wants the three answers at a glance and nothing else.
 *
 * **Changed.** *Hierarchy:* the box is a raised plate (the materials' `plate`, under a
 * `--border-strong` hairline) instead of a ground-coloured box with an inset line, so it reads
 * as lifted above the Stage rather than printed on it (`references/craft-details.md`, layered
 * surfaces). The title is the one strong line; rows share one label column, so the three values
 * start on one vertical (alignment). *Colour meaning:* every control is neutral; the metronome
 * belongs to no part (`hues.ts`). *Contrast:* the "can't sound" caption is `--text-2`, not a faint
 * caption ink, because it explains why nothing happens (`references/color.md`, 4.5:1 for text).
 *
 * **Kept.** Controlled: every change is a callback and it holds no state. On/Off and Bell as
 * lamps, Volume as a 0–127 line slider, their names and tips; Esc (caught before the window's
 * shortcuts) and a press outside (except on the opener, `[aria-controls=<id>]`) call `onClose`;
 * the slider's arrow keys never reach the window. Where it sits is the parent's: it draws in place.
 */
export function MetronomePopover(props: MetronomePopoverProps) {
  return <Tree tree={metronomePopoverView(props)} handlers={metronomePopoverHandlers(props)} />;
}

export default MetronomePopover;
