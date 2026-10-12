import './Separator.css';

export interface SeparatorProps {
  /** `short`: a control's height less one `--space-3` step, centred in the row; `full`: the row's whole height. */
  length?: 'short' | 'full';
}

/**
 * Separator: the vertical hairline between groups in a row.
 *
 * **Job.** Split a row of tabs or controls into groups (the app bar's two tab runs, its right
 * area) so a player sees where one group ends without reading the labels. It is structure, not
 * content: it should be the quietest mark on the bar.
 *
 * **Changed.** *Alignment*: the original was a fixed 16px line lifted off the row's bottom edge
 * by a magic offset to land on one header's text baseline. Here the short line is the control
 * height less one `--space-3` step, centred in the row, so it stands almost as tall as the
 * `--control-h` tabs beside it in every density (a line of label type, 16px, sat visibly short of
 * them on a 34px row), with no offset to keep in sync (craft-details.md › optical alignment).
 * *Contrast*: a 16px line in the faint hairline colour all but vanished on a black ground (about
 * 1.4:1), so the short line takes `--border-strong` while the full-height line, which has length
 * to be seen by, keeps `--border`. Both use the chrome's `--border-width` (never under 1px), so
 * a heavier chrome gets heavier dividers like its other rules.
 *
 * **Kept.** One plain line, no colour of its own, the two lengths, decorative and hidden from
 * assistive tech (the groups it splits are announced by their own roles); the parent spaces it.
 */
export function Separator({ length = 'short' }: SeparatorProps) {
  return <span className="yh-separator" data-part="root" data-length={length} aria-hidden="true" />;
}
