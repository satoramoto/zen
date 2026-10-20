import { Tree } from '../../view/Tree';
import { healthSlotHandlers, healthSlotView, type HealthSlotModelProps } from './HealthSlot.model';
import '../../primitives/Text.css';
import './HealthSlot.css';

// The props, the tree and its handlers are framework-free, in the model; this file and
// `HealthSlot.svelte` only hand the model's tree to their `Tree`.
export type { HealthTarget } from './health';
export type { HealthSlotModelProps } from './HealthSlot.model';
export type HealthSlotProps = HealthSlotModelProps;

/**
 * HealthSlot: the app bar's audio health.
 *
 * **Job.** Say "Audio" quietly while the sound is fine, and name the one trouble that matters
 * (a failed plugin, no audio, dropouts, a busy CPU) as a button that opens where to fix it. A
 * player glances at it between songs: calm must fade into the bar, trouble must be found at once.
 *
 * **Changed.** *Colour meaning, never colour alone:* every state now has a shape as well as a
 * colour (color.md, "Semantic Colors": semantics work through pairs). Calm and off wear the same
 * `StatusDot` as the Launchkey beside it, filled `ok` when fine and a hollow faint ring when the
 * audio is off, so the bar's two connections say "fine" with one mark, not a round dot and a
 * square one; trouble is the danger chip with its triangle. The chip is the same recipe as
 * StatusLine's error (12% `--danger` tint inside a 35% edge, the triangle, strong `--text-1`, one
 * space step shorter than a control), so the Stage has one look for "something is wrong", and its
 * words stay in primary text so they keep full contrast under every pack (color.md, "Contrast and
 * Readability"). *Hierarchy:* every state is at label size and in sentence case: calm "Audio" is
 * quiet by colour (faint text), not by a smaller size and a different case, so the slot has one
 * type treatment; trouble is the loudest thing in it, in the strong weight. *Numerals:* the counts
 * and the CPU percentage are drawn in the readout face with tabular figures, so "CPU 74%" doesn't
 * jitter as it changes (typography.md, "Tabular Numbers"); a digit in a part's name ("R3 failed")
 * stays in the name's face, so the name isn't set in two. *Affordance:* a trouble row is a framed, tinted
 * button and every clickable row takes a hover tint and a pointer, so it reads as something to
 * press; the original was bare text with no hover. Focus is a `:focus-visible` ring in the accent
 * (craft-details.md, "Focus States"). `tipAction` runs the app's tooltip action, in Pad's handle
 * shape, on whichever element carries `tip`, moving to the new one when calm turns to trouble.
 *
 * **Kept.** The one pure `health()` choice and its order (a silent failed plugin first), the exact
 * texts, "Audio off" staying neutral yet clickable, the hidden polite live region that says
 * "Audio health: …", buttons named by their visible text only, the calm text hidden from screen
 * readers, `tip` as `data-tip` on whichever element shows (null turns it off), the ellipsis when the
 * slot is narrow, and no motion beyond a hover fade (off under reduced motion).
 */
export function HealthSlot(props: HealthSlotProps) {
  return <Tree tree={healthSlotView(props)} handlers={healthSlotHandlers(props)} />;
}
