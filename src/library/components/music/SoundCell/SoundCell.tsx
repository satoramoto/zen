import type { ReactNode } from 'react';
import { Text } from '../../../primitives/Text';
import { soundCellView, type SoundCellModelProps } from './SoundCell.model';
import './SoundCell.css';

// The props and the view are framework-free, in the model; `SoundCell.svelte` renders the same view.
export type { SoundCellModelProps } from './SoundCell.model';

export interface SoundCellProps extends SoundCellModelProps {
  /** The marks after the sound's name (the part's marks). */
  marks?: ReactNode;
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
export function SoundCell(props: SoundCellProps) {
  const { marks, onPart, onSound } = props;
  const view = soundCellView(props);
  return (
    <div className={view.root.className} {...view.root.attrs}>
      <Text as="button" {...view.part.text} className={view.part.className} {...view.part.attrs} onClick={() => onPart?.()}>
        {view.part.label}
      </Text>
      <Text as="button" {...view.sound.text} className={view.sound.className} {...view.sound.attrs} onClick={() => onSound?.()}>
        <span className={view.title.className}>{view.title.label}</span>
        {view.number && (
          <Text {...view.number.text} className={view.number.className} {...view.number.attrs}>
            {view.number.label}
          </Text>
        )}
        {marks != null && <span className={view.marksClassName}>{marks}</span>}
      </Text>
    </div>
  );
}
