import type { ReactNode } from 'react';
import './SoundCell.css';

/** The board's four parts; each maps onto one contract hue (see SoundCell.css). */
export type PartHue = 'r1' | 'r2' | 'r3' | 'l';

export interface SoundCellProps {
  /** The part's short name ("R1", "L"). */
  part: string;
  /** The part's full name, for the buttons' names and the short name's title ("Right 1"). */
  partName: string;
  /** The part's hue. */
  hue?: PartHue;
  /** The sound's number in its list ("41"). Empty: not shown. */
  number?: string;
  /** The sound's name; a long one ends in an ellipsis. */
  sound: string;
  /** The part is off: its short name fades in its own hue, the sound steps back. */
  off?: boolean;
  /** The sound button's accessible name. Default: "Right 1 sound: 1 Stage Grand. Opens the quick sound list". */
  soundName?: string;
  /** The tooltip key of the part's short name, set as `data-tip`. */
  partTip?: string;
  /** The tooltip key of the sound, set as `data-tip`. */
  soundTip?: string;
  /** The marks after the sound's name (the part's marks). */
  marks?: ReactNode;
  /** Called when the short name is pressed (opens Channel). */
  onPart?: () => void;
  /** Called when the sound is pressed (opens the quick sound list). */
  onSound?: () => void;
}

/**
 * One part's cell on the display's sound row: the part's short name, then its sound.
 *
 * **Job**: tell a player at a glance which sound each part is playing, and whether the part is
 * on; give two targets, the part (opens Channel) and the sound (opens the quick sound list).
 *
 * **Changed**: the side-by-side line becomes a caption over a name, the same shape as the
 * RackCell, so a row of cells shares one left edge and one baseline rhythm and scans like a
 * table (alignment, rhythm; `references/typography.md` on a small caption over the value). The
 * short name drops to caption size in the pack's label case, and keeps the part's hue as the
 * cell's only colour: hue identifies the part, nothing else is tinted (colour meaning;
 * `references/color.md`). The sound's number sits in the readout face with tabular numerals in
 * muted text so names line up across cells (numerals). Only the name truncates; the short name
 * and number never do. Both buttons get a quiet face on hover, a deeper one when pressed, and
 * the accent focus ring on keyboard focus (affordance; `references/craft-details.md` on
 * `:focus-visible`). An off part fades its hue against the surface rather than going grey, so
 * it still says which part it is.
 *
 * **Kept**: two buttons and their callbacks, their spoken names ("Right 1: open Channel",
 * "Right 1 sound: 1 Stage Grand. Opens the quick sound list"), the full part name as the short
 * name's title, the marks after the name, and the tooltip keys as `data-tip`.
 */
export function SoundCell({
  part,
  partName,
  hue = 'r1',
  number = '',
  sound,
  off = false,
  soundName,
  partTip,
  soundTip,
  marks,
  onPart,
  onSound,
}: SoundCellProps) {
  const spoken =
    soundName ?? `${partName} sound: ${[number, sound].filter(Boolean).join(' ')}. Opens the quick sound list`;
  return (
    <div className="yh-sound-cell" data-hue={hue} data-off={off ? 'true' : undefined}>
      <button
        type="button"
        className="yh-sound-cell__part"
        title={partName}
        aria-label={`${partName}: open Channel`}
        data-tip={partTip}
        onClick={() => onPart?.()}
      >
        {part}
      </button>
      <button
        type="button"
        className="yh-sound-cell__sound"
        aria-label={spoken}
        data-tip={soundTip}
        onClick={() => onSound?.()}
      >
        {number && <span className="yh-sound-cell__number">{number}</span>}
        <span className="yh-sound-cell__title">{sound}</span>
        {marks != null && <span className="yh-sound-cell__marks">{marks}</span>}
      </button>
    </div>
  );
}
