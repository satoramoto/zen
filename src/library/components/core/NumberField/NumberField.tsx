import { useCallback, useState, type ChangeEvent, type CSSProperties, type FocusEvent, type KeyboardEvent } from 'react';
import { defaultOrigin, fillFrom, hintAttribute, useReserved, type FillOrigin } from '../Param/fill';
import { clamp, quantize, type Param } from '../Param/param';
import { useParamGesture } from '../Param/useParamGesture';
import { focusRing } from '../../../primitives/Ring';
import { Text } from '../../../primitives/Text';
import './NumberField.css';

export type { FillOrigin } from '../Param/fill';

/** `live.numbox`: drag it like a fader, or type into it. Mirrors `@openflow/widgets` NumberField. */
export interface NumberFieldProps {
  param: Param;
  value: number;
  onChange(next: number): void;
  onRelease?(): void;
  disabled?: boolean;
  /** Authoritative text; wins over the parameter's own formatting. */
  display?: string;
  /** For assistive technology. Defaults to the caption. */
  label?: string;
  /** The printed caption. Defaults to the parameter's short name, then its name. */
  name?: string;
  /** Typing a digit or pressing Enter opens the editor. Never for an enum. */
  editable?: boolean;
  /** The value drawn as a bar behind the text, as Live's own value boxes do. */
  showFill?: boolean;
  /** Where that bar grows from. Defaults to the middle when zero is the middle. */
  origin?: FillOrigin;
  /** In px. Defaults to the parameter's longest reading, so it never resizes. */
  width?: number;
  /** Pixels of drag for the full range. */
  travel?: number;
  className?: string;
  title?: string;
  /** A sentence for the window's hint strip, on the root as `data-hint`. Falls back to `title`. */
  hint?: string;
}

const OPENS_EDITOR = /^[-+.0-9]$/;

/**
 * **Job.** A parameter's value as a number you can read exactly and change in place: the value box
 * of a device panel, where a knob would be too coarse and a field too slow.
 *
 * **Behaviour.** Controlled through `onChange` (and `onRelease` when a gesture ends). A horizontal
 * drag grabs the value where it is (no jump to the click), ⌘/Ctrl held for fine; ← → ↑ ↓ step,
 * Page Up / Down ten steps, Home / End the ends; a double-click (that wasn't a drag) resets to the
 * parameter's default; Escape abandons a drag in hand. When `editable` (and not an enum), a digit,
 * sign, point or Enter opens a text editor: Enter or blur commits (clamped and quantized), Escape
 * cancels. The box reserves its longest reading so it never resizes as it counts. `role="slider"`
 * named by `label`, else the caption.
 *
 * **Type.** The caption is a `caption` `Text` in the label case; the body and the input are
 * `numeral` `Text`s at the label size, untracked.
 *
 * **Parts** (`data-part`). `caption` the name; `body` the value window, a `screen`; `fill` the
 * value as a lit bar from `origin` (`--lit`, `--mat-lit-glow`); `text` the reading, in the readout
 * face with tabular figures; `ink` the same reading in `--on-hue`, clipped to the fill so the digits
 * stay legible over it; `input` the editor that replaces `body` while typing.
 */
export function NumberField({
  param,
  value,
  onChange,
  onRelease,
  disabled = false,
  display,
  label,
  name = param.shortName ?? param.name,
  editable = true,
  showFill = true,
  origin = defaultOrigin(param),
  width,
  travel,
  className,
  title,
  hint,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const reserved = useReserved(param);
  const typeable = editable && param.kind !== 'enum' && param.kind !== 'blob' && !disabled;

  const gesture = useParamGesture({
    param,
    value,
    onChange,
    onRelease,
    disabled,
    axis: 'horizontal',
    travel,
    label: label ?? name,
    display,
  });

  const commit = useCallback(
    (text: string) => {
      setDraft(null);
      const parsed = Number.parseFloat(text);
      if (Number.isNaN(parsed)) return;
      onChange(quantize(param, clamp(param, parsed)));
      onRelease?.();
    },
    [onChange, onRelease, param],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (typeable && (e.key === 'Enter' || OPENS_EDITOR.test(e.key))) {
      e.preventDefault();
      e.stopPropagation();
      setDraft(e.key === 'Enter' ? '' : e.key);
      return;
    }
    gesture.props.onKeyDown(e);
  };

  // `role` is Text's type role, so the gesture's ARIA role goes in `ariaRole`.
  const { role: ariaRole, ...surface } = gesture.props;

  const style = {
    ...reserved,
    ...fillFrom(param, origin, gesture.fraction),
    ...(width === undefined ? {} : { '--lib-number-field-width': `${width}px` }),
  } as CSSProperties;

  return (
    <div
      className={`lib-number-field${className ? ` ${className}` : ''}`}
      data-disabled={disabled || undefined}
      {...hintAttribute(hint)}
      style={style}
    >
      {name && (
        <Text role="caption" case="label" className="lib-number-field__caption" data-part="caption">
          {name}
        </Text>
      )}
      {draft === null ? (
        <Text
          as="div"
          role="numeral"
          size="label"
          ariaRole={ariaRole}
          className={`lib-number-field__body ${focusRing}`}
          data-part="body"
          title={title}
          {...surface}
          onKeyDown={onKeyDown}
        >
          {showFill && <span className="lib-number-field__fill" data-part="fill" aria-hidden="true" />}
          <span className="lib-number-field__text" data-part="text">
            {gesture.text}
          </span>
          {showFill && (
            <span className="lib-number-field__ink" data-part="ink" aria-hidden="true">
              {gesture.text}
            </span>
          )}
        </Text>
      ) : (
        <Text
          as="input"
          role="numeral"
          size="label"
          className="lib-number-field__body lib-number-field__input"
          data-part="input"
          ref={(node: HTMLInputElement | null) => {
            node?.focus();
          }}
          value={draft}
          aria-label={label ?? name}
          inputMode="decimal"
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.currentTarget.value)}
          onBlur={(e: FocusEvent<HTMLInputElement>) => commit(e.currentTarget.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') commit(e.currentTarget.value);
            else if (e.key === 'Escape') setDraft(null);
            else return;
            e.preventDefault();
          }}
        />
      )}
    </div>
  );
}
