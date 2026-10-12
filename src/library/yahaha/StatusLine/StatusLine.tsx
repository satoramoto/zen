import { Fragment } from 'react';
import { Text } from '../../primitives/Text';
import type { Forms } from '../../layout/assembly/types';
import './StatusLine.css';

/** The line's one form, for an assembled screen's footer: one control height, full width. */
export const STATUS_LINE_FORMS: Forms<'line'> = [
  { id: 'line', min: { w: 0, h: { control: 1 } }, ideal: { w: 0, h: { control: 1 } }, grow: { w: true } },
];

/** A control's tooltip, shown in the line's place while the control is hovered or focused. */
export interface StatusHint {
  /** The entry's title. */
  title: string;
  /** What the control does. */
  body: string;
  /** Its keys, already labelled ("Y", "Shift+Y / F5"). */
  keys?: string | null;
  /** Where it is on the Launchkey. */
  launchkey?: string | null;
}

export interface StatusLineProps {
  /** The hovered or focused control's tooltip: shown in place of the message while set. */
  hint?: StatusHint | null;
  /** `message.text`. `null` or `''`: no message, the line is empty. */
  text?: string | null;
  /** `message.error`: the error mark shows before the text. Ignored while there is no text. */
  error?: boolean;
  /** `message.seq`. A new value re-creates the button's contents, so a repeat is announced again. */
  seq?: number;
  /** A fixed width in px. Unset, the line fills its container. */
  width?: number;
  /** The tooltip key from `app/src/help/tooltips.ts`, as `data-tip` on the button. `null` turns it off. */
  tip?: string | null;
  /** Called on click, Enter or Space on the line's button; the parent sends `clearMessage`. */
  onClear?: () => void;
}

/**
 * The one line between the band and the keys that says what the app just did or refused.
 *
 * **Job:** show the last notice or error (`state.message`) in one quiet line a player can take in
 * with a glance and put away with a click, Enter or Space; while a control is hovered or focused,
 * show that control's tooltip in the same place. Empty, the row keeps its height so nothing below
 * it moves.
 *
 * **Changed:** *colour meaning, never colour alone*: an error leads with a chip, the warning
 * triangle plus the word "Error" on a faint `--danger` tint inside a `--danger` edge, so shape,
 * word and colour all say it, while the message itself stays in `--text-1` to read as plain words,
 * not alarm (refero-design `color.md` › Semantic colors work through pairs). The chip is the same
 * recipe as the app bar's health trouble (12% tint, 35% edge, triangle, strong `--text-1`, one
 * space step shorter than a control), so "something is wrong" looks one way on the Stage.
 * *Hierarchy*: the chip is at `--size-label`, not caption, because it is read mid-song from a
 * metre; in a hint the title is `--weight-strong` in `--text-1`, the body steps down to
 * `--text-2`, and the key and Launchkey place sit right-aligned as captions ("Key", "Launchkey",
 * one form, no colons) in `--text-3` with the keys drawn as keycaps, so the eye lands on the name,
 * then what it does, then how to reach it (`typography.md` › weight creates hierarchy).
 * *Numerals*: keycaps are in `--font-readout` with tabular figures like every other key name on
 * the Stage, not a mono face, and share the row's line height. *Affordance*: a small clear mark
 * sits at the line's end on every message, quiet in `--text-3` and stepping up to `--text-1` on
 * hover or focus, so a notice can be dismissed on a touch or Launchkey rig where nothing hovers;
 * focus uses a `:focus-visible` ring in `--accent` (`craft-details.md` › Focus states).
 * *Rhythm*: the row is `--control-h` tall and spaced on `--space-*`, so it sits on the same grid
 * as the controls around it under every density.
 *
 * **Kept:** one line that ellipsises instead of wrapping, the `role="status"` polite live region,
 * the button named by its content with a visually hidden "Error:" (so name and announcement match),
 * contents keyed on `seq` inside a button that keeps focus, a hint that is `aria-hidden` while the
 * message stays announced underneath it, `tip` as `data-tip`, no timer and no motion of its own.
 */
export function StatusLine({ hint = null, text = null, error = false, seq = 0, width, tip = 'display.status', onClear }: StatusLineProps) {
  return (
    <Text
      as="p"
      tabular
      className="yh-status-line"
      data-part="root"
      ariaRole="status"
      aria-live="polite"
      style={width === undefined ? undefined : { width: `${width}px` }}
    >
      {hint ? (
        <span className="yh-status-line-hint" data-part="hint" aria-hidden="true">
          <Text weight="strong" tabular className="yh-status-line-hint-title" data-part="hint-title">{hint.title}</Text>
          <span className="yh-status-line-hint-body" data-part="hint-body">{hint.body}</span>
          {hint.keys || hint.launchkey ? (
            <span className="yh-status-line-hint-meta" data-part="hint-meta">
              {hint.keys ? (
                <span className="yh-status-line-hint-place" data-part="hint-place">
                  <Text role="caption" case="label" tabular className="yh-status-line-hint-label" data-part="hint-label">Key</Text>{' '}
                  <Text as="kbd" role="caption" tabular className="yh-status-line-key" data-part="key">{hint.keys}</Text>
                </span>
              ) : null}
              {hint.launchkey ? (
                <span className="yh-status-line-hint-place" data-part="hint-place">
                  <Text role="caption" case="label" tabular className="yh-status-line-hint-label" data-part="hint-label">Launchkey</Text>{' '}
                  <Text as="kbd" role="caption" tabular className="yh-status-line-key" data-part="key">{hint.launchkey}</Text>
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      ) : null}
      {text ? (
        <button
          type="button"
          className={hint ? 'yh-status-line-button yh-status-line-under' : 'yh-status-line-button'}
          data-part="button"
          data-tip={tip ?? undefined}
          onClick={() => onClear?.()}
        >
          <Fragment key={seq}>
            {error ? (
              <Text role="label" leading="tight" tabular className="yh-status-line-tag" data-part="tag" aria-hidden="true">
                <svg data-hue="warn" className="yh-status-line-mark" data-part="mark" width="12" height="12" viewBox="0 0 12 12">
                  <path d="M6 1.5 L11 10.5 H1 Z" />
                  <path d="M6 5 V7.4" />
                  <circle cx="6" cy="8.9" r="0.6" />
                </svg>
                Error
              </Text>
            ) : null}
            {/* The space after "Error:" sits outside the hidden span: the accessible name trims each
                element's text, so a space inside it would be lost ("Error:Can't"). */}
            <span className="yh-status-line-text" data-part="text">
              {error ? <span className="yh-status-line-hidden" data-part="hidden">Error:</span> : null}
              {error ? ` ${text}` : text}
            </span>
          </Fragment>
          <svg className="yh-status-line-clear" data-part="clear" aria-hidden="true" width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 2 L8 8 M8 2 L2 8" />
          </svg>
        </button>
      ) : null}
    </Text>
  );
}
