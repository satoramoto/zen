import type { ReactNode } from 'react';
import './RackCell.css';

export interface RackCellProps {
  /** The rack's name ("Sunday drive"). Empty: "No rack". */
  rack: string;
  /** The Quick Rack slot it's on ("A1"). Empty: no slot shown. */
  slot?: string;
  /** The small word before the slot. */
  label?: string;
  /** The accessible name. Default: "Rack: Sunday drive, on Quick Rack A1. Opens the Rack page". */
  name?: string;
  /** The tooltip key, set as `data-tip`. */
  tip?: string;
  /** The marks after the name (the modified dot). */
  mark?: ReactNode;
  /** Called on a click, Space or Enter (opens the Rack page). */
  onPress?: () => void;
}

/**
 * The rack readout at the head of the display's sound row: "Rack · A1" over the rack's name.
 *
 * **Job**: say which rack is loaded and which Quick Rack slot it came from, and open the Rack
 * page when pressed.
 *
 * **Changed**: the caption drops to caption size in the pack's label case and muted text, and
 * the name rises to body size, so the line that changes reads first (hierarchy;
 * `references/typography.md` on a small caption over the value). The slot is lifted out of the
 * caption in the readout face, full text colour and label size (a step above the caption since
 * the 2026-10 review, so the cell's one value is never its smallest thing): it is a value, not
 * part of the label (contrast, numerals). Only the name truncates, and the mark sits after the ellipsis rather
 * than being clipped with it. The cell shares SoundCell's caption-over-name shape and its
 * text inset, so the rack and the parts start on one left edge across the row (alignment,
 * rhythm). No colour: the rack isn't a part, so it takes no hue (`references/color.md`). The
 * faceless button gains a quiet face on hover, a deeper one when pressed, and the accent ring
 * on keyboard focus (affordance; `references/craft-details.md` on `:focus-visible`). "No rack"
 * shows as a muted caption, so an empty slot doesn't read as a rack called that or take a
 * name's room.
 *
 * **Kept**: one flat button with its spoken name ("Rack: Sunday drive, on Quick Rack A1. Opens
 * the Rack page"), the "No rack" fallback, no slot shown when there is none, the mark after the
 * name, and the tooltip key as `data-tip`.
 */
export function RackCell({ rack, slot = '', label = 'Rack', name, tip, mark, onPress }: RackCellProps) {
  const empty = rack.trim() === '';
  const shown = empty ? 'No rack' : rack;
  const spoken = name ?? `${label}: ${shown}${slot ? `, on Quick Rack ${slot}` : ''}. Opens the Rack page`;
  return (
    <div className="yh-rack-cell">
      <button
        type="button"
        className="yh-rack-cell__button"
        aria-label={spoken}
        data-tip={tip}
        onClick={() => onPress?.()}
      >
        <span className="yh-rack-cell__head">
          <span className="yh-rack-cell__label">{label}</span>
          {slot && (
            <>
              <span className="yh-rack-cell__separator" aria-hidden>
                ·
              </span>
              <span className="yh-rack-cell__slot">{slot}</span>
            </>
          )}
        </span>
        <span className="yh-rack-cell__name" data-empty={empty ? 'true' : undefined}>
          <span className="yh-rack-cell__title">{shown}</span>
          {mark != null && <span className="yh-rack-cell__mark">{mark}</span>}
        </span>
      </button>
    </div>
  );
}
