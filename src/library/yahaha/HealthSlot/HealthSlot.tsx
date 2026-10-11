import { health, type HealthTarget } from './health';
import './HealthSlot.css';

export type { HealthTarget } from './health';

export interface HealthSlotProps {
  /** The first keyboard part (0–3: R1 R2 R3 L) whose plugin failed and isn't missing (`firstFailedPart`). */
  failedPart?: 0 | 1 | 2 | 3 | null;
  /** False when there is no audio (`io.synth` is null). */
  synthOn?: boolean;
  /** Audio dropouts in the last 30 s, counted by the wiring. */
  dropouts?: number;
  /** The buffer in use, in frames (64 … 1024); null when unknown. */
  bufferFrames?: number | null;
  /** The CPU load, 1.0 = the whole buffer; null before the first meters frame. */
  cpu?: number | null;
  /** A fixed width in px. Default: fills its container's width. */
  width?: number;
  /** The tooltip key, as `data-tip` on the button (or the calm text); null turns it off. */
  tip?: string | null;
  /** Called with where to fix the trouble on a click, Enter or Space. */
  onOpen?: (target: HealthTarget) => void;
}

/** Splits "CPU 74%" into words and numerals, so the numerals can wear the readout face. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+%?)/).map((part, i) =>
        i % 2 ? (
          <span key={i} className="yh-health-slot__num">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * HealthSlot: the app bar's audio health.
 *
 * **Job.** Say "Audio" quietly while the sound is fine, and name the one trouble that matters
 * (a failed plugin, no audio, dropouts, a busy CPU) as a button that opens where to fix it. A
 * player glances at it between songs: calm must fade into the bar, trouble must be found at once.
 *
 * **Changed.** *Colour meaning, never colour alone:* every state now has a shape as well as a
 * colour: a small filled dot when calm, a hollow ring when the audio is off, a warning triangle in
 * the danger role for trouble (color.md, "Semantic Colors": semantics work through pairs). Trouble
 * also gets a faint danger tint behind the text while its words stay in primary text, so the
 * message keeps full contrast under every pack, light or dark (color.md, "Contrast and
 * Readability"). *Hierarchy:* calm "Audio" is a quiet label in faint text and the pack's label case;
 * trouble is the loudest thing in the slot, in the strong weight. *Numerals:* the counts and the CPU
 * percentage are drawn in the readout face with tabular figures, so "CPU 74%" doesn't jitter as it
 * changes (typography.md, "Tabular Numbers"). *Affordance:* a trouble row is a framed, tinted
 * button and every clickable row takes a hover tint and a pointer, so it reads as something to
 * press; the original was bare text with no hover. Focus is a `:focus-visible` ring in the accent
 * (craft-details.md, "Focus States").
 *
 * **Kept.** The one pure `health()` choice and its order (a silent failed plugin first), the exact
 * texts, "Audio off" staying neutral yet clickable, the hidden polite live region that says
 * "Audio health: …", buttons named by their visible text only, the calm text hidden from screen
 * readers, `tip` as `data-tip` on whichever element shows (null turns it off), the ellipsis when the
 * slot is narrow, and no motion beyond a hover fade (off under reduced motion).
 */
export function HealthSlot({
  failedPart = null,
  synthOn = true,
  dropouts = 0,
  bufferFrames = null,
  cpu = null,
  width,
  tip = 'app.health',
  onOpen,
}: HealthSlotProps) {
  const shown = health({ failedPart, synthOn, dropouts, bufferFrames, cpu });
  const state = shown.target === null ? 'calm' : shown.hue === 'ending' ? 'trouble' : 'off';
  const dataTip = tip ?? undefined;
  const target = shown.target;

  return (
    <span
      className={`yh-health-slot${width === undefined ? ' yh-health-slot--fill' : ''}`}
      data-hue={shown.hue}
      data-state={state}
      style={width === undefined ? undefined : { width: `${width}px` }}
    >
      <span role="status" className="yh-health-slot__live">
        {shown.label}
      </span>
      {target ? (
        <button type="button" className="yh-health-slot__button" data-tip={dataTip} onClick={() => onOpen?.(target)}>
          <span className="yh-health-slot__mark" aria-hidden="true" />
          <span className="yh-health-slot__text">
            <Words text={shown.text} />
          </span>        </button>
      ) : (
        <span className="yh-health-slot__calm">
          <span className="yh-health-slot__mark" aria-hidden="true" />
          <span className="yh-health-slot__text" aria-hidden="true" data-tip={dataTip}>
            {shown.text}
          </span>
        </span>
      )}
    </span>
  );
}
