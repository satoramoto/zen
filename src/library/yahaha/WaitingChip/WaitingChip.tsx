import { Tree } from '../../view/Tree';
import { waitingChipView, type WaitingChipModelProps } from './WaitingChip.model';
import '../../primitives/Text.css';
import './WaitingChip.css';

// The props and the chip are framework-free, in the model; this file and `WaitingChip.svelte` only
// hand the model's tree (none for a blank label) to their `Tree`.
export type { WaitingHue, WaitingSize, WaitingChipModelProps } from './WaitingChip.model';

export type WaitingChipProps = WaitingChipModelProps;

/**
 * WaitingChip: names what comes next (the next section, a style waiting for the bar line).
 *
 * **Job.** Say what will play next, quieter than what plays now, so a player can read it at a
 * glance and know it is coming, not playing. A readout, not a control: no click, focus or tooltip.
 *
 * **Changed.** *Colour meaning, never colour alone:* the original tinted the words themselves in
 * the section's hue, so "coming" was carried only by a paler colour, and some hues failed contrast
 * as text on light grounds. Now a small forward-pointing arrow before the words says "next" by
 * shape, and only that arrow takes colour. The four categorical hues belong to the four parts
 * (`../hues`), so a waiting section no longer wears one: what is queued next reads `--accent`
 * (`SECTION_STATE_COLOUR.next`) whichever section it is, and the words name the section. A queued
 * style's arrow wears the contract's `--style` role hue, the colour of the style and what belongs
 * to it, so a waiting style reads as the style's and never as the section "next" role. The default
 * (`t`) arrow is `--accent` too: next is `--accent` everywhere, by default, so a caller that
 * forgets to pass a section still says "next" (it used to fall back to a grey `--text-3` arrow).
 * The words sit in secondary text so they pass contrast in every pack
 * (color.md, "Semantic Colors" and "Contrast and Readability"). *Hierarchy:* secondary text keeps
 * the chip a step below what plays; the `display` size uses the display face and weight so the
 * next section reads from across the room (typography.md, "Type Scale"), and its arrow is 0.45 ×
 * 0.6 em, as large in proportion as at label size, so beside display words it reads as an arrow,
 * not a bullet. *Rhythm:* heights come from the density's control height, the style line's cap
 * from it too (six control heights, where the original fixed 200px), and the arrow's gap from the
 * spacing scale, so the chip sits on the same line as the controls beside it. *Materials:* named
 * parts (`data-part`: chip, arrow); words and an arrow on whatever holds it, so no material.
 *
 * **Kept.** An empty or whitespace-only label renders nothing at all; the label is drawn untrimmed;
 * only `line` caps its width and ends in "…" (and shrinks in a flex row); tabular figures; the
 * section values of `hue`; the `data-face="waiting"`, `data-hue` and `data-size` hooks; no role,
 * focus or motion.
 *
 * **Tuning knobs.** `--yh-waiting-chip-hue` (the arrow's colour role: `--accent`, `--style` for a
 * queued style, set inline for a section), `--yh-waiting-chip-max` (the `line` size's width cap,
 * six control heights).
 */
export function WaitingChip(props: WaitingChipProps) {
  const tree = waitingChipView(props);
  return tree && <Tree tree={tree} />;
}
