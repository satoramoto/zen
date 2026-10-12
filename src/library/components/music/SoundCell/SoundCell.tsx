import type { ReactNode } from 'react';
import type { HueSlot } from '../../core/hue';
import { focusRing } from '../../../primitives/Ring';
import { Text } from '../../../primitives/Text';
import './SoundCell.css';

export interface SoundCellProps {
  /** The part's short name ("R1", "L"). */
  part: string;
  /** The part's full name, for the buttons' names and the short name's title ("Right 1"). */
  partName: string;
  /** The part's categorical hue slot (`--hue-1` … `--hue-4`); an app maps its meaning (e.g. Yahaha's parts). Default 1. */
  hue?: HueSlot;
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
 * short name is set at `--size-label` in the pack's label case, and keeps the part's hue slot as
 * the cell's only colour: hue identifies the part, nothing else is tinted, and hue on text is never
 * smaller than the label size, so the part is findable from the keyboard (colour meaning;
 * `references/color.md`; the 2026-10 review moved it up from caption size). The sound's number
 * follows the name, at caption size in the readout face with tabular numerals in muted text, so
 * it no longer reads as part of the name ("41 Warm Strings") and every name starts on the cell's
 * left edge (numerals, alignment). Only the name truncates; the short name and number never do. Both buttons get a quiet face on hover, a deeper one when pressed, and
 * the accent focus ring on keyboard focus (affordance; `references/craft-details.md` on
 * `:focus-visible`). An off part fades its hue against the surface rather than going grey, so
 * it still says which part it is.
 *
 * **Kept**: two buttons and their callbacks, their spoken names ("Right 1: open Channel",
 * "Right 1 sound: 1 Stage Grand. Opens the quick sound list"), the full part name as the short
 * name's title, the marks after the name, and the tooltip keys as `data-tip`.
 *
 * **Tuning knobs.**
 * - `--yh-part-hue`: the part's ink, `--hue-N` from `hue`; the short name wears it (faded when off).
 * - `--yh-sound-cell-width`: the cell's width on the row (default `14em`); the row may set it.
 */
export function SoundCell({
  part,
  partName,
  hue = 1,
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
      <Text
        as="button"
        role="label"
        tabular
        type="button"
        className={`yh-sound-cell__part ${focusRing}`}
        title={partName}
        aria-label={`${partName}: open Channel`}
        data-tip={partTip}
        onClick={() => onPart?.()}
      >
        {part}
      </Text>
      <Text
        as="button"
        role="caption"
        size="body"
        tabular
        type="button"
        className={`yh-sound-cell__sound ${focusRing}`}
        aria-label={spoken}
        data-tip={soundTip}
        onClick={() => onSound?.()}
      >
        <span className="yh-sound-cell__title">{sound}</span>
        {number && (
          <Text role="caption" tabular className="yh-sound-cell__number">
            {number}
          </Text>
        )}
        {marks != null && <span className="yh-sound-cell__marks">{marks}</span>}
      </Text>
    </div>
  );
}
