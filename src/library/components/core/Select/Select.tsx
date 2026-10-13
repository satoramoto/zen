import type { CSSProperties } from 'react';
import { Text } from '../../../primitives/Text';
import { useControlContext } from '../../../primitives/Stack';
import { Popover } from '../Popover/Popover';
import { TYPING_WINDOW, useSelect, type UseSelectOptions } from './useSelect';
import './Select.css';

export { TYPING_WINDOW, useSelect, type UseSelectOptions };

export interface SelectProps {
  items: readonly string[];
  index: number;
  onChange(next: number): void;
  disabled?: boolean;
  /** The accessible name; falls back to `name`. */
  label?: string;
  /** A visible caption before the field. */
  name?: string;
  /** In px. Settle caller-owned labels so changing the selection can't resize a panel. */
  width?: number;
  className?: string;
  title?: string;
  /** A sentence for the host's hint strip, on the root as `data-hint`. */
  hint?: string;
}

/**
 * A compact enum: one member on screen, the rest in a menu of our own.
 *
 * **Job.** Choose one of many where only the choice needs to be seen (a blend mode, a scale, an
 * input): a field the width of its longest member, so changing it never resizes the panel it
 * sits in. The open menu is ours, not the system's, so it wears the same theme as everything
 * around it.
 *
 * **Behaviour.** An ARIA select-only combobox (behaviour in `useSelect`). Click, Enter or Space
 * opens; closed, the arrows, Home, End and type-ahead pick straight away; open, they move the
 * highlight and Enter takes it. A letter repeated walks the members starting with it; a word
 * searches. `onChange` fires only on a change. Focus never leaves the trigger. Escape, a pointer
 * or a wheel elsewhere closes it (only Escape puts focus back); Tab closes without being
 * swallowed. Handled keys are stopped so a surface underneath doesn't act on them.
 *
 * **In a toolbar.** Inside a toolbar `Group` (`ControlContext { quiet: true }`) the trigger is
 * quiet: no fill, border or shadow, the value in the bar's ink and the caret in a quieter one, a
 * faint tint from the material only on hover and while open. Same height, width and hit target;
 * keys and the menu are unchanged. The root says so as `data-quiet`. There is no prop for it: the
 * context changes the look, never a per-use style.
 *
 * **Parts.** `root` (`--lib-select-chars`, the longest member; `--lib-select-width` when `width`
 * is set), `caption` (the `name`), `trigger` (a `key`), `value`, `caret`, `menu` (a `Popover`,
 * so a float `Layer`, at least the trigger's width), `option` (`data-active` while highlighted,
 * `data-chosen` for the held member).
 */
export function Select({ items, index, onChange, disabled = false, label, name, width, className, title, hint }: SelectProps) {
  const chars = Math.max(0, ...items.map((item) => item.length));
  const s = useSelect({ items, index, onChange, disabled });
  // In a toolbar Group the trigger is quiet: the context decides the look, not the caller.
  const { quiet } = useControlContext();
  // `role` is the ARIA role here; on a Text that prop is the type role.
  const { role: triggerRole, ...trigger } = s.triggerProps;

  return (
    <div
      className={`lib-select${className ? ` ${className}` : ''}`}
      data-part="root"
      data-disabled={disabled || undefined}
      data-open={s.open || undefined}
      data-quiet={quiet || undefined}
      data-hint={hint}
      style={
        {
          '--lib-select-chars': chars,
          ...(width === undefined ? {} : { '--lib-select-width': `${width}px` }),
        } as CSSProperties
      }
    >
      {name && (
        <Text role="body" size="label" case="label" className="lib-select__caption" data-part="caption">
          {name}
        </Text>
      )}
      <Text
        as="button"
        role="body"
        size="label"
        weight="strong"
        ariaRole={triggerRole}
        {...trigger}
        className="lib-select__trigger"
        data-part="trigger"
        aria-label={label ?? name}
        title={title}
      >
        <span className="lib-select__value" data-part="value">
          {items[s.at] ?? ''}
        </span>
        <span className="lib-select__caret" data-part="caret" aria-hidden="true" />
      </Text>
      {s.open && (
        <Popover anchor={s.trigger} onDismiss={s.dismiss} id={s.menuId} className="lib-select__menu" role="listbox" label={label ?? name}>
          {items.map((item, which) => {
            // `role` is the ARIA role here; on a Text that prop is the type role.
            const { role, ...option } = s.optionProps(which);
            return (
              <Text
                as="div"
                role="body"
                size="label"
                ariaRole={role}
                key={`${item}-${which}`}
                {...option}
                className="lib-select__option"
                data-part="option"
              >
                <span className="lib-select__value">{item}</span>
              </Text>
            );
          })}
        </Popover>
      )}
    </div>
  );
}

export default Select;
