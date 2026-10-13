import type { ReactNode } from 'react';
import { Text } from '../../../primitives/Text';
import { Popover } from '../Popover/Popover';
import { useSelect } from '../Select/useSelect';
import './AxisPicker.css';

export interface AxisPickerProps {
  /** The measures it can show, as their names ("Speed", "Brightness"…). */
  items: readonly string[];
  /** The one shown. */
  index: number;
  /** Fires only on a change. */
  onChange(next: number): void;
  /** The accessible name: which axis it picks ("Across", "Up", "Colour"). */
  label: string;
  /** `horizontal` (under a plot, or in a title row) or `vertical` (along a plot's left edge, reading bottom to top). */
  orientation?: 'horizontal' | 'vertical';
  /** The low end's word ("slow"), at the start of the axis (left, or the bottom when vertical); none when left out. */
  low?: ReactNode;
  /** The high end's word ("fast"), at the end of the axis (right, or the top when vertical); none when left out. */
  high?: ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
}

/**
 * A chart axis's own picker: the measure the axis shows, written on the axis, and a menu of the
 * others.
 *
 * **Job.** Say what an axis measures where the eye already is, and let it be changed there: a
 * quiet chip ("Speed ▾") on the axis, the words for its two ends either side of it ("slow" …
 * "fast"). It carries no meaning of its own: the caller names the measures and the ends.
 *
 * **Behaviour.** An ARIA select-only combobox, the same as `Select` (behaviour in `useSelect`):
 * the chip is a `button` with role `combobox` named by `label`. Click, Enter or Space opens;
 * closed, the arrows, Home, End and type-ahead pick straight away; open, they move the highlight
 * and Enter takes it. `onChange` fires only on a change. Focus never leaves the chip. Escape, a
 * pointer or a wheel elsewhere closes the menu (only Escape puts focus back); Tab closes without
 * being swallowed. `horizontal` (the default) is a row filling its box's width: `low` at the
 * left, the chip centred, `high` at the right; with neither end it is just the chip, its own
 * width (`data-bare`), for a title row. `vertical` is a column filling its box's height, for a
 * plot's left edge: `high` at the top, `low` at the bottom, the chip between them reading bottom
 * to top (its caret pointing at the plot). The ends' words stay upright. With only one end
 * given, the other's place is kept empty so the chip stays centred.
 *
 * **Parts.** `root` (`data-orientation`, `data-open`, `data-disabled`, `data-bare`), `low` and
 * `high` (the ends' words: caption type, muted, tabular, never wrapping), `trigger` (the chip:
 * no field edge, a faint wash of the ink at rest so it reads as pickable, stronger on hover and
 * while open), `value`, `caret`, `menu` (the listbox, inside a `Popover`, at least the chip's
 * width), `option` (`data-active` while highlighted, `data-chosen` for the shown measure).
 *
 * **Tuning knobs.** On the root: `--lib-axis-picker-wash` (the chip's tint at rest),
 * `--lib-axis-picker-wash-hover` (on hover and on a highlighted option),
 * `--lib-axis-picker-wash-open` (while open or pressed), `--lib-axis-picker-caret` (the caret's
 * length), `--lib-axis-picker-gap` (the least room between the chip and an end); on the chip,
 * `--lib-axis-picker-tint` (whichever wash is over it now).
 */
export function AxisPicker({
  items,
  index,
  onChange,
  label,
  orientation = 'horizontal',
  low,
  high,
  disabled = false,
  title,
  className,
}: AxisPickerProps) {
  const s = useSelect({ items, index, onChange, disabled });
  // `role` is the ARIA role here; on a Text that prop is the type role.
  const { role: triggerRole, ...trigger } = s.triggerProps;
  const hasLow = low !== undefined && low !== null && low !== false;
  const hasHigh = high !== undefined && high !== null && high !== false;
  const bare = !hasLow && !hasHigh;

  const end = (part: 'low' | 'high', word: ReactNode, shown: boolean) =>
    bare ? null : (
      <Text
        role="caption"
        tone="muted"
        tabular
        className={`lib-axis-picker__end lib-axis-picker__${part}`}
        data-part={part}
        aria-hidden={shown ? undefined : true}
      >
        {shown ? word : null}
      </Text>
    );

  return (
    <div
      className={`lib-axis-picker${className ? ` ${className}` : ''}`}
      data-part="root"
      data-orientation={orientation}
      data-open={s.open || undefined}
      data-disabled={disabled || undefined}
      data-bare={bare || undefined}
    >
      {end('low', low, hasLow)}
      <Text
        as="button"
        role="body"
        size="label"
        weight="strong"
        ariaRole={triggerRole}
        {...trigger}
        className="lib-axis-picker__trigger"
        data-part="trigger"
        aria-label={label}
        title={title}
      >
        <span className="lib-axis-picker__value" data-part="value">
          {items[s.at] ?? ''}
        </span>
        <span className="lib-axis-picker__caret" data-part="caret" aria-hidden="true" />
      </Text>
      {end('high', high, hasHigh)}
      {s.open && (
        <Popover anchor={s.trigger} onDismiss={s.dismiss} className="lib-axis-picker__panel">
          <div className="lib-axis-picker__menu" data-part="menu" role="listbox" id={s.menuId} aria-label={label}>
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
                  className="lib-axis-picker__option"
                  data-part="option"
                >
                  {item}
                </Text>
              );
            })}
          </div>
        </Popover>
      )}
    </div>
  );
}

export default AxisPicker;
