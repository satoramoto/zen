// Text's model: the roles, tones and refinements, and the view a renderer draws (its classes and
// attributes). No framework: `Text.tsx` (React) and `Text.svelte` (Svelte) both render `textView`.
import type { HueSlot } from '../components/core/hue';
import { h, type Node } from '../view/Tree.model';

/** What `h` takes after its attributes (elements, text, slots, components, lists, holes): what a
 *  primitive's tree builder (`textNode`, `stackNode`, …) passes on as the element's children. */
export type TreeChildren = Parameters<typeof h> extends [unknown, unknown?, ...infer C] ? C : never;

/** The type roles, each a face, weight, size, tracking and case from the contract. */
export const TEXT_ROLES = ['display', 'numeral', 'heading', 'body', 'label', 'caption', 'code', 'math'] as const;
export type TextRole = (typeof TEXT_ROLES)[number];

/** The ink tones: the four text levels, the palette's signal colours, ink on a solid action fill,
 *  the five categorical hue slots and the two role hues. */
export const TEXT_TONES = [
  'primary',
  'secondary',
  'muted',
  'faint',
  'accent',
  'success',
  'warning',
  'danger',
  'on-solid',
  1,
  2,
  3,
  4,
  5,
  'role-1',
  'role-2',
] as const;
export type TextTone =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'faint'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'on-solid'
  | HueSlot
  | 'role-1'
  | 'role-2';

/** The `data-tone` value for a tone: hue slots become `hue-N`. Shared by `Text` and `Icon`. */
export function toneAttr(tone: TextTone | undefined): string | undefined {
  if (tone === undefined) return undefined;
  return typeof tone === 'number' ? `hue-${tone}` : tone;
}

/** Line height over the role's: `tight` 1, `snug` 1.15, `normal` the face's own, `none` 0 (a glyph
 *  box that adds no line). Omitted, the role's leading. */
export const TEXT_LEADINGS = ['tight', 'snug', 'normal', 'none'] as const;
export type TextLeading = (typeof TEXT_LEADINGS)[number];

/** A contract weight. */
export const TEXT_WEIGHTS = ['body', 'strong', 'display', 'numeral'] as const;
export type TextWeight = (typeof TEXT_WEIGHTS)[number];

/** Case over the role's: `upper`, `label` (the theme's `--label-case`) or `none`. */
export const TEXT_CASES = ['upper', 'label', 'none'] as const;
export type TextCase = (typeof TEXT_CASES)[number];

/** A size: another role's size, or `inherit` (the parent's, `1em`). */
export type TextSize = TextRole | 'inherit';

/** What Text decides from, in any framework (each renderer adds its element, children and native props). */
export interface TextModelProps {
  /** The type role; default `body`. (This is the type role, not an ARIA role: see `ariaRole`.) */
  role?: TextRole;
  /** The ARIA role, since `role` is the type role. */
  ariaRole?: string;
  /** The ink; omitted, the colour is inherited. */
  tone?: TextTone;
  /** Tabular (fixed-width) figures. On for `numeral` and `code` unless `false`. */
  tabular?: boolean;
  /** One line, cut with an ellipsis; may shrink inside a flex or grid track. */
  truncate?: boolean;
  /** Line height over the role's. A control label usually wants `tight`. */
  leading?: TextLeading;
  /** Another role's size on this role's face and weight; `inherit` is the parent's size. */
  size?: TextSize;
  /** A contract weight over the role's. */
  weight?: TextWeight;
  /** Case over the role's. */
  case?: TextCase;
  /** Classes added after the Text's own. */
  className?: string;
}

/** A rendered element's class and attributes: every value a string, or undefined for no attribute. */
export interface ElementView {
  className: string;
  attrs: Record<string, string | undefined>;
}

/** Text's element: `lib-text lib-tone` plus the caller's class, the ARIA role and the `data-*` its CSS reads. */
export function textView({
  role = 'body',
  ariaRole,
  tone,
  tabular,
  truncate,
  leading,
  size,
  weight,
  case: textCase,
  className,
}: TextModelProps): ElementView {
  return {
    className: `lib-text lib-tone${className ? ` ${className}` : ''}`,
    attrs: {
      role: ariaRole,
      'data-role': role,
      'data-tone': toneAttr(tone),
      'data-tabular': tabular === undefined ? undefined : tabular ? '' : 'false',
      'data-truncate': truncate ? '' : undefined,
      'data-text-leading': leading,
      'data-text-size': size,
      'data-text-weight': weight,
      'data-text-case': textCase,
    },
  };
}

/**
 * Text as a view-tree element, for a model to inline: `textNode({ role: 'label', as: 'button' },
 * { 'data-part': 'face' }, 'Play')` is the element `<Text as="button" role="label" data-part="face">`
 * draws, its attributes (`attrs`, after Text's own) and children added. The same DOM as the `Text`
 * component, with no component in between.
 */
export function textNode(props: TextModelProps & { as?: string }, attrs: Record<string, string | undefined> = {}, ...children: TreeChildren): Node {
  const view = textView(props);
  return h(props.as ?? 'span', { class: view.className, ...view.attrs, ...attrs }, ...children);
}
