// Icon's model: the sizes, and the view a renderer draws (the slot's class and attributes, the
// SVG's). No framework: `Icon.tsx` (React) and `Icon.svelte` (Svelte) both render `iconView`.
import { h, type Node } from '../view/Tree.model';
import { toneAttr, type ElementView, type TextRole, type TextTone, type TreeChildren } from './Text.model';

/** An icon's size: a type role's size (so it matches the text beside it) or the control height. */
export type IconSize = TextRole | 'control';
export const ICON_SIZES = ['display', 'numeral', 'heading', 'body', 'label', 'caption', 'code', 'control'] as const;

/** What Icon decides from, in any framework (each renderer adds its SVG content and native props). */
export interface IconModelProps {
  /** A type role's size (`code` is the body size) or `control` (`--control-h`); default `1em`. */
  size?: IconSize;
  /** The ink, as `Text`'s tone; omitted, the colour is inherited. */
  tone?: TextTone;
  /** What it means, for assistive tech. Without one the icon is decorative and hidden. */
  label?: string;
  /** The SVG's viewBox; default `0 0 24 24`. */
  viewBox?: string;
  /** Classes added after the Icon's own. */
  className?: string;
}

/** What a renderer draws: the slot (a `span`) and the `svg` inside it. */
export interface IconView {
  slot: ElementView;
  svg: Record<string, string>;
}

/** Icon's slot (`lib-icon lib-tone` plus the caller's class, an image with its label or hidden) and its SVG. */
export function iconView({ size, tone, label, viewBox = '0 0 24 24', className }: IconModelProps): IconView {
  return {
    slot: {
      className: `lib-icon lib-tone${className ? ` ${className}` : ''}`,
      attrs: {
        'data-size': size,
        'data-tone': toneAttr(tone),
        role: label ? 'img' : undefined,
        'aria-label': label,
        'aria-hidden': label ? undefined : 'true',
      },
    },
    svg: { viewBox, focusable: 'false', 'aria-hidden': 'true' },
  };
}

/**
 * Icon as a view-tree element, for a model to inline: `iconNode({ size: 'label' }, {}, h('path', {
 * d: '…' }))` is the slot `<Icon size="label">` draws with its `svg` inside, the slot's attributes
 * (`attrs`, after Icon's own) added and the children (SVG content) in the `svg`. The same DOM as
 * the `Icon` component, with no component in between.
 */
export function iconNode(props: IconModelProps, attrs: Record<string, string | undefined> = {}, ...children: TreeChildren): Node {
  const view = iconView(props);
  return h('span', { class: view.slot.className, ...view.slot.attrs, ...attrs }, h('svg', view.svg, ...children));
}
