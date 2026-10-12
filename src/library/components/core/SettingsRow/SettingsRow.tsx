import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';
import './SettingsRow.css';

export interface SettingsRowProps {
  /** The setting's name, in the label column ("Main timing"). */
  label: string;
  /** A short note after the control ("Fader button 7"). Empty: none. */
  hint?: string;
  /** The label column's width in px (the boards' 120). */
  labelWidth?: number;
  /** The control: a lamp, a run of tabs, a slider, a readout. Its own accessible name stays its own. */
  children?: ReactNode;
}

/**
 * One setting on a Settings page: its name, then its control, then an optional hint. No box:
 * rows stack under their group's header.
 *
 * **Job**: let a player run their eye down a Settings page and find a setting by name, then read
 * or change its value without hunting for which control belongs to which name.
 *
 * **Changed**: the three parts now sit on shared columns, not just a shared label column. The
 * label column keeps its fixed width, and the control column takes a minimum width
 * (`--yh-settings-control-w`, which a page may set once on the stack) so the hints start on one
 * line down the page instead of wherever each control happens to end (alignment;
 * `references/typography.md` §7 on vertical rhythm). The row grows a quiet `--surface-1` band on
 * hover and while its control has focus, so the name and the control read as one thing across
 * the column gap (affordance; `references/craft-details.md` §1 on `:focus-within` for compound
 * controls), with the control's own focus ring left as the precise mark. The name steps up to
 * `--text-1` and the hint down to `--text-3`, one size for the row, so hierarchy comes from
 * ink, not size (`references/typography.md` §4 text colour system). A long name or hint
 * truncates with an ellipsis but keeps its full text in a `title`, so nothing meaningful is
 * lost (`references/typography.md` §10, content overflow). No colour of its own: colour belongs to
 * the control's state (`references/color.md`). The row is a labelled `group` (named by its
 * label, described by its hint), so a screen reader announces the setting with its note.
 *
 * **Kept**: the order name → control → hint, the fixed label column (`labelWidth`, 120 by
 * default), one line per row, tabular numerals, and the control keeping its own name and keys.
 */
export function SettingsRow({ label, hint = '', labelWidth = 120, children }: SettingsRowProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const style = { '--yh-settings-label-w': `${labelWidth}px` } as CSSProperties;
  return (
    <div
      className="yh-settings-row"
      data-part="root"
      role="group"
      aria-labelledby={labelId}
      aria-describedby={hint ? hintId : undefined}
      style={style}
    >
      <span className="yh-settings-row__label" data-part="label" id={labelId} title={label}>
        {label}
      </span>
      <span className="yh-settings-row__control" data-part="control">{children}</span>
      {hint && (
        <span className="yh-settings-row__hint" data-part="hint" id={hintId} title={hint}>
          {hint}
        </span>
      )}
    </div>
  );
}
