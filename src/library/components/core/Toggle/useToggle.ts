import { useState } from 'react';

/** The five control sizes (macOS's kit: mini, small, regular, large, extra large). Each maps to a
 *  fraction of the scale's `--control-h` (`size.css`), so a size grows with the theme's scale. */
export type ControlSize = 'mini' | 'small' | 'regular' | 'large' | 'xlarge';
export const CONTROL_SIZES: readonly ControlSize[] = ['mini', 'small', 'regular', 'large', 'xlarge'];

/**
 * An on/off value, controlled or the control's own: with `value` set the parent owns it and
 * `set` only asks (through `onChange`); without it the control keeps its own state, starting from
 * `initial`. Shared by `Switch` and `Disclosure`.
 */
export function useToggle(
  value: boolean | undefined,
  initial: boolean,
  onChange?: (next: boolean) => void,
): [boolean, (next: boolean) => void] {
  const [own, setOwn] = useState(initial);
  const current = value ?? own;
  return [
    current,
    (next) => {
      if (value === undefined) setOwn(next);
      onChange?.(next);
    },
  ];
}
