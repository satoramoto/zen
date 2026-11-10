/** The five control sizes (macOS's kit: mini, small, regular, large, extra large). Each maps to a
 *  fraction of the scale's `--control-h` (`size.css`), so a size grows with the theme's scale. */
export type ControlSize = 'mini' | 'small' | 'regular' | 'large' | 'xlarge';
export const CONTROL_SIZES: readonly ControlSize[] = ['mini', 'small', 'regular', 'large', 'xlarge'];
