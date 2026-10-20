import { Fragment } from 'react';
import { Text } from '../../primitives/Text';
import { statusLineView, type StatusLineModelProps } from './StatusLine.model';
import './StatusLine.css';

// The props, the form and the view are framework-free, in the model; `StatusLine.svelte` renders the same view.
export { STATUS_LINE_FORMS, statusLineView, type StatusHint, type StatusLineModelProps } from './StatusLine.model';

export type StatusLineProps = StatusLineModelProps;

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
export function StatusLine({ onClear, ...props }: StatusLineProps) {
  const { width, hint, message } = statusLineView(props);
  return (
    <Text
      as="p"
      tabular
      className="yh-status-line"
      data-part="root"
      ariaRole="status"
      aria-live="polite"
      style={width === undefined ? undefined : { width }}
    >
      {hint ? (
        <span className="yh-status-line-hint" data-part="hint" aria-hidden="true">
          <Text weight="strong" tabular className="yh-status-line-hint-title" data-part="hint-title">{hint.title}</Text>
          <span className="yh-status-line-hint-body" data-part="hint-body">{hint.body}</span>
          {hint.places.length > 0 ? (
            <span className="yh-status-line-hint-meta" data-part="hint-meta">
              {hint.places.map((place) => (
                <span key={place.label} className="yh-status-line-hint-place" data-part="hint-place">
                  <Text role="caption" case="label" tabular className="yh-status-line-hint-label" data-part="hint-label">{place.label}</Text>{' '}
                  <Text as="kbd" role="caption" tabular className="yh-status-line-key" data-part="key">{place.key}</Text>
                </span>
              ))}
            </span>
          ) : null}
        </span>
      ) : null}
      {message ? (
        <button type="button" className={message.className} {...message.attrs} onClick={() => onClear?.()}>
          <Fragment key={message.seq}>
            {message.error ? (
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
              {message.error ? <span className="yh-status-line-hidden" data-part="hidden">Error:</span> : null}
              {message.text}
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
