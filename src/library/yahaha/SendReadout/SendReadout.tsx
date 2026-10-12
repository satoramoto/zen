import './SendReadout.css';

export interface SendReadoutProps {
  /** The reverb send, 0-127. */
  reverb: number;
  /** The chorus send, 0-127. */
  chorus: number;
  /** The delay send, 0-127. */
  delay: number;
  /** The lead word ("Band"): it starts the spoken name; not drawn (the Effects page it opens says whose sends). */
  label?: string;
  /** The accessible name. Default: "Band sends: reverb 40, chorus 12, delay 0. Opens Effects". */
  name?: string;
  /** The tooltip key, set as `data-tip`. */
  tip?: string;
  /** Called on a click, Space or Enter (opens Effects). */
  onPress?: () => void;
}

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
export function SendReadout({ reverb, chorus, delay, label = 'Band', name, tip, onPress }: SendReadoutProps) {
  const sends = [
    ['Reverb', reverb],
    ['Chorus', chorus],
    ['Delay', delay],
  ] as const;
  const spoken = name ?? `${label} sends: reverb ${reverb}, chorus ${chorus}, delay ${delay}. Opens Effects`;

  return (
    <button type="button" className="yh-send-readout" aria-label={spoken} data-tip={tip} onClick={() => onPress?.()}>
      {sends.map(([word, level]) => (
        <span key={word} className="yh-send-readout-send" data-off={level === 0 ? '' : undefined}>
          <span className="yh-send-readout-name">{word}</span>
          <span className="yh-send-readout-level">{level}</span>
        </span>
      ))}
    </button>
  );
}
