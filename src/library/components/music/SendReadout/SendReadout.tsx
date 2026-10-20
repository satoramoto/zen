import { Tree } from '../../../view/Tree';
import { sendReadoutHandlers, sendReadoutView, type SendReadoutModelProps } from './SendReadout.model';
import '../../../primitives/Text.css';
import './SendReadout.css';

// The props and the tree are framework-free, in the model; `SendReadout.svelte` draws the same tree.
export type { SendReadoutModelProps } from './SendReadout.model';

export type SendReadoutProps = SendReadoutModelProps;

/**
 * SendReadout: the band's effect sends on the style line, "Band Reverb 40 Chorus 12 Delay 0".
 *
 * **Job.** Tell a player at a glance how much reverb, chorus and delay the band carries, and take
 * them to Effects with one press.
 *
 * **Changed.** *Hierarchy:* one size on the line, two inks: each send's name in secondary text and
 * its level at the same `--size-label` in primary text, in the readout face at numeral weight, so
 * the eye lands on the numbers by weight without three heading numerals outranking the chord on
 * the style line (the 2026-10 review: heading numerals only where the number is the region's
 * headline, the Fader and the Knob). The "Band" lead caption is gone from the face: it was a
 * fourth type size in one line, and the button's spoken name still starts with it.
 * *Numerals:* tabular figures in a fixed 3ch box, right-aligned, so 9 → 127 doesn't push the next
 * send along (typography.md, "Tabular Numbers"). *Colour meaning:* the levels move from the accent
 * to primary text, and a send at 0 drops to `--text-3`, so "off" reads without reading the
 * number (a Knob at 0 or Off does the same); the accent is left for focus
 * (color.md, "Component Color Limit"). *Affordance:* it shows a quiet surface on hover and a
 * `:focus-visible` ring, so it reads as pressable without a button face (craft-details.md, "Focus
 * States").
 *
 * **Kept.** One flat inline row that sits on the style line; a real button with the spoken name
 * "Band sends: reverb 40, chorus 12, delay 0. Opens Effects"; click, Space and Enter all press it.
 */
export function SendReadout(props: SendReadoutProps) {
  return <Tree tree={sendReadoutView(props)} handlers={sendReadoutHandlers(props)} />;
}
