import './SendReadout.css';

export interface SendReadoutProps {
  /** The reverb send, 0-127. */
  reverb: number;
  /** The chorus send, 0-127. */
  chorus: number;
  /** The delay send, 0-127. */
  delay: number;
  /** The lead word ("Band"). */
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
 * **Changed.** *Hierarchy:* three tiers instead of one size: the lead word is a small caption, each
 * send's name a label, its level the largest thing, in the readout face at numeral weight, so the
 * eye lands on the numbers first (typography.md). *Numerals:* tabular figures in a fixed 3ch box,
 * right-aligned, so 9 → 127 doesn't push the next send along (typography.md, "Tabular Numbers").
 * *Colour meaning:* the levels move from the accent to primary text, and a send at 0 drops to the
 * faint text role, so "off" reads without reading the number; the accent is left for focus
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
      <span className="yh-send-readout-lead">{label}</span>
      {sends.map(([word, level]) => (
        <span key={word} className="yh-send-readout-send" data-off={level === 0 ? '' : undefined}>
          <span className="yh-send-readout-name">{word}</span>
          <span className="yh-send-readout-level">{level}</span>
        </span>
      ))}
    </button>
  );
}
