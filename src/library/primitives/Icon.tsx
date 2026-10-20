import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import type { TextTone } from './Text';
import { Tree } from '../view/Tree';
import { slot } from '../view/Tree.model';
import { iconNode, type IconSize } from './Icon.model';
import './Text.css';
import './Icon.css';

// The sizes are framework-free, in the model; `Icon.svelte` renders the same view.
export { ICON_SIZES, iconView, type IconSize, type IconModelProps } from './Icon.model';

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
export function Icon({ size, tone, label, viewBox, className, children, ...rest }: IconProps) {
  return <Tree tree={iconNode({ size, tone, label, viewBox, className }, {}, slot('children'))} slots={{ children }} {...rest} />;
}
