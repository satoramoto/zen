import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { toneAttr, type TextRole, type TextTone } from './Text';
import './Text.css';
import './Icon.css';

/** An icon's size: a type role's size (so it matches the text beside it) or the control height. */
export type IconSize = TextRole | 'control';
export const ICON_SIZES = ['display', 'numeral', 'heading', 'body', 'label', 'caption', 'code', 'control'] as const;

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** A type role's size (`code` is the body size) or `control` (`--control-h`); default `1em`. */
  size?: IconSize;
  /** The ink, as `Text`'s tone; omitted, the colour is inherited. */
  tone?: TextTone;
  /** What it means, for assistive tech. Without one the icon is decorative and hidden. */
  label?: string;
  /** The SVG's viewBox; default `0 0 24 24`. */
  viewBox?: string;
  /** SVG content drawn with `currentColor`: strokes by default; set `fill="currentColor"` to fill. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * **Job.** A slot for an inline SVG: square, sized on the scale, inked by tone. Paths stroke in
 * the current colour (no fill) unless they ask to fill. With a `label` it is an image with that
 * name; without, it is hidden from assistive tech.
 *
 * **Tuning knobs.** `--lib-icon-size` (the square's side), `--lib-icon-stroke` (stroke width in
 * viewBox units).
 */
export function Icon({ size, tone, label, viewBox = '0 0 24 24', className, children, ...rest }: IconProps) {
  return (
    <span
      className={`lib-icon lib-tone${className ? ` ${className}` : ''}`}
      data-size={size}
      data-tone={toneAttr(tone)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      <svg viewBox={viewBox} focusable="false" aria-hidden="true">
        {children}
      </svg>
    </span>
  );
}
