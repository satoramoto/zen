import { useCallback, useRef, type ChangeEvent, type KeyboardEvent, type Ref } from 'react';
import { Text } from '../../../primitives/Text';
import './SearchField.css';

export interface SearchFieldProps {
  /** The text in the field. The parent owns it: typing only calls `onInput`. */
  value?: string;
  /** The field's accessible name, visually hidden ("Search styles"). */
  label: string;
  /** The hint shown while the field is empty ("Search"). */
  placeholder?: string;
  /** A fixed width in px. Default: fills its container. */
  width?: number;
  /** The tooltip key, set as `data-tip` on the input for the app's tooltip layer. */
  tip?: string;
  /** Called with the field's text on every edit, and with '' when Esc or the clear button clears it. */
  onInput?: (value: string) => void;
  /** Called on every key the field doesn't handle itself (all but Esc on a non-empty field). */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** The `<input>` itself, so the page can focus it (a ⌘F shortcut) or read its selection. */
  ref?: Ref<HTMLInputElement>;
  /** Shown, not editable: the input is disabled, dimmed, and the clear button goes. */
  disabled?: boolean;
  /** The native hover hint on the field, e.g. "Search presets (⌘F)". */
  title?: string;
}

/**
 * The search field of the Library pages (styles, sounds, instruments).
 *
 * **Job**: take a few letters fast and narrow the list beside it, while the arrow keys keep
 * driving that list. A player needs to see that the field is a field, whether it has focus,
 * and whether a filter is on.
 *
 * **Changed**: the field follows the pack's input chrome (`--input-fill`,
 * `--input-border-sides`, `--input-border-bottom`, `--radius-input`) on the density's
 * `--control-h`, instead of always drawing an underline, so it sits with the other inputs of
 * any theme (consistency). Focus draws the accent ring around the whole field, not only a darker
 * line, so it reads at a glance (affordance; `references/craft-details.md` on `:focus-within`
 * for compound controls). The magnifier is `--text-3` while empty and steps up to `--text-2`
 * once a filter is on, and the placeholder is `--text-3` against typed text in `--text-1`, so
 * "filter on" never depends on reading the text (`references/typography.md`'s text colour
 * system; `references/color.md`: no hue, nothing here means a category). A non-empty field gains
 * a clear button, the pointer twin of Esc, kept out of the tab order so the field stays one
 * stop.
 *
 * **Kept**: controlled `value` with `onInput` per edit; Esc on a non-empty field clears it and
 * stops there; on an empty field Esc and every other key reach `onKeyDown` and the page;
 * a `searchbox` named by a visually hidden label; no autocomplete or spellcheck.
 *
 * **Added**: `ref` reaches the `<input>` (a page focuses it from a shortcut); `disabled` dims the
 * field to `--text-4` with a dashed edge, as a disabled key reads, takes the input out of reach
 * and drops the clear button; `title` is the field's hover hint.
 */
export function SearchField({ value = '', label, placeholder, width, tip, onInput, onKeyDown, ref, disabled = false, title }: SearchFieldProps) {
  const input = useRef<HTMLInputElement | null>(null);
  // The input is ours (the clear button refocuses it) and the caller's (`ref`).
  const setInput = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const filled = value !== '';

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && filled) {
      event.preventDefault();
      event.stopPropagation();
      onInput?.('');
      return;
    }
    onKeyDown?.(event);
  }

  return (
    <div
      className="yh-search-field"
      data-filled={filled ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      title={title}
      style={{ width: width === undefined ? '100%' : `${width}px` }}
    >
      <label className="yh-search-field__label">
        <svg className="yh-search-field__glass" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="9.4" y1="9.4" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="yh-search-field__name">{label}</span>
        <Text
          as="input"
          role="body"
          ref={setInput}
          type="search"
          className="yh-search-field__input"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          data-tip={tip}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onInput?.(event.currentTarget.value)}
          onKeyDown={keyDown}
        />
      </label>
      {filled && !disabled && (
        <button
          type="button"
          className="yh-search-field__clear"
          aria-label="Clear search"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onInput?.('');
            input.current?.focus();
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
