import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Text } from '../../../primitives/Text';
import './Segmented.css';

export interface SegmentedProps {
  items: readonly string[];
  /**
   * What a screen reader names each member, by position, for members that show only a glyph or an
   * abbreviation (`'s'` → `'seconds'`). A member with no entry (or an empty one) is named by its text.
   */
  itemLabels?: readonly (string | undefined)[];
  index: number;
  onChange(next: number): void;
  disabled?: boolean;
  /** The group's accessible name; falls back to `name`. */
  label?: string;
  /** A visible caption before the group. */
  name?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  title?: string;
  /** A sentence for the host's hint strip, on the root as `data-hint`. */
  hint?: string;
}

/** The members of an enum parameter (anything with `items`), for handing straight to `items`. */
export function itemsOf(param: { readonly items?: readonly string[] }): readonly string[] {
  return param.items ?? [];
}

/**
 * The behaviour of a segmented radiogroup: arrows move the choice by one (clamped, never
 * wrapping), handled keys are stopped so a surface underneath doesn't act on them, only the
 * chosen radio takes Tab, and focus follows the choice when it moves from inside the group.
 */
export function useSegmented({ items, index, onChange, disabled = false }: Pick<SegmentedProps, 'items' | 'index' | 'onChange' | 'disabled'>) {
  const group = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    group.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  }, [index]);

  const move = (e: KeyboardEvent<HTMLDivElement>, by: number) => {
    e.preventDefault();
    e.stopPropagation();
    moved.current = true;
    onChange(Math.max(0, Math.min(items.length - 1, index + by)));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(e, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(e, -1);
  };

  const radioProps = (at: number) => ({
    type: 'button' as const,
    role: 'radio',
    'aria-checked': at === index,
    tabIndex: at === index ? 0 : -1,
    disabled,
    onClick: () => onChange(at),
  });

  return { group, onKeyDown, radioProps };
}

/**
 * An enum with every member on screen at once.
 *
 * **Job.** Choose one of a few where the alternatives are worth seeing (a filter type, a unit, a
 * direction). Drawn with the theme's tabs materials, so it is the same object as layout `Tabs`: a
 * track with the members printed in it and the chosen one standing out of it.
 *
 * **Behaviour.** A `radiogroup` of `radio` buttons (behaviour in `useSegmented`). Click picks; ←
 * → (and ↑ ↓) move the choice by one, clamped, and focus follows it; only the chosen member takes
 * Tab. Disabled: the group is `aria-disabled` and every member disabled. `itemLabels` names a
 * glyph-only member for a screen reader while the glyph stays on screen.
 *
 * **Parts.** `root` (`data-orientation`, `data-disabled`), `caption` (the `name`), `track` (the
 * radiogroup, `--mat-tabs-track-*`), `segment` (each radio: `--mat-tabs-tab-*` at rest,
 * `--mat-tabs-chosen-*` when checked).
 */
export function Segmented({
  items,
  itemLabels,
  index,
  onChange,
  disabled = false,
  label,
  name,
  orientation = 'horizontal',
  className,
  title,
  hint,
}: SegmentedProps) {
  const { group, onKeyDown, radioProps } = useSegmented({ items, index, onChange, disabled });

  return (
    <div
      className={`lib-segmented${className ? ` ${className}` : ''}`}
      data-part="root"
      data-orientation={orientation}
      data-disabled={disabled || undefined}
      data-hint={hint}
    >
      {name && (
        <Text role="body" size="label" case="label" className="lib-segmented__caption" data-part="caption">
          {name}
        </Text>
      )}
      <div
        ref={group}
        className="lib-segmented__track"
        data-part="track"
        role="radiogroup"
        aria-label={label ?? name}
        aria-disabled={disabled || undefined}
        aria-orientation={orientation}
        title={title}
        onKeyDown={onKeyDown}
      >
        {items.map((item, at) => {
          // `role` is the ARIA role here; on a Text that prop is the type role.
          const { role, ...radio } = radioProps(at);
          return (
            <Text
              as="button"
              role="body"
              size="label"
              weight="strong"
              case="label"
              ariaRole={role}
              key={`${item}-${at}`}
              {...radio}
              className="lib-segmented__segment"
              data-part="segment"
              aria-label={itemLabels?.[at] || undefined}
            >
              {item}
            </Text>
          );
        })}
      </div>
    </div>
  );
}

export default Segmented;
