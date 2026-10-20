import type { ReactNode } from 'react';
import { Text } from '../../../primitives/Text';
import { rackCellView, type RackCellModelProps } from './RackCell.model';
import './RackCell.css';

// The props and the view are framework-free, in the model; `RackCell.svelte` renders the same view.
export type { RackCellModelProps } from './RackCell.model';

export interface RackCellProps extends RackCellModelProps {
  /** The marks after the name (the modified dot). */
  mark?: ReactNode;
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
 *
 * **Tuning knobs.**
 * - `--yh-rack-cell-width`: the cell's width on the row (default `12em`); the row may set it.
 */
export function RackCell(props: RackCellProps) {
  const { mark, onPress } = props;
  const view = rackCellView(props);
  return (
    <div className={view.rootClassName}>
      <button className={view.button.className} {...view.button.attrs} type="button" onClick={() => onPress?.()}>
        <Text {...view.head.text} className={view.head.className} {...view.head.attrs}>
          <span className={view.label.className}>{view.label.label}</span>
          {view.slot && (
            <>
              <span className={view.slot.separator.className} {...view.slot.separator.attrs}>
                {view.slot.separator.char}
              </span>
              <Text {...view.slot.value.text} className={view.slot.value.className} {...view.slot.value.attrs}>
                {view.slot.value.label}
              </Text>
            </>
          )}
        </Text>
        <Text {...view.name.text} className={view.name.className} {...view.name.attrs}>
          <Text {...view.title.text} className={view.title.className} {...view.title.attrs}>
            {view.title.label}
          </Text>
          {mark != null && <span className={view.markClassName}>{mark}</span>}
        </Text>
      </button>
    </div>
  );
}
