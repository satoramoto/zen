import type { AllHTMLAttributes, AriaRole, CSSProperties, ElementType, ReactNode, Ref } from 'react';
import type { HueSlot } from '../components/core/hue';
import './Text.css';

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

export interface TextProps extends Omit<AllHTMLAttributes<HTMLElement>, 'role' | 'size' | 'as'> {
  /** The type role; default `body`. (This is the type role, not an ARIA role: see `ariaRole`.) */
  role?: TextRole;
  /** The ARIA role, since `role` is the type role. */
  ariaRole?: AriaRole;
  /** The ink; omitted, the colour is inherited. */
  tone?: TextTone;
  /** Tabular (fixed-width) figures. On for `numeral` and `code` unless `false`. */
  tabular?: boolean;
  /** One line, cut with an ellipsis; may shrink inside a flex or grid track. */
  truncate?: boolean;
  /** Line height over the role's. A control label usually wants `tight`. */
  leading?: TextLeading;
  /** Another role's size on this role's face and weight; `inherit` is the parent's size. A
   *  component's own size goes in the `--text-size` knob on this element's class instead. */
  size?: TextSize;
  /** A contract weight over the role's. */
  weight?: TextWeight;
  /** Case over the role's. */
  case?: TextCase;
  /** The element to render; default `span`. */
  as?: ElementType;
  /** Forwarded to the rendered element (`any`: the element is whatever `as` names). */
  ref?: Ref<any>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * **Job.** Text in a role. The role decides the face (`--font-sans`, `--font-display`,
 * `--font-mono`, `--font-readout`), weight, size, tracking, leading and case from the contract;
 * `display` takes `--tracking-display`, `label` takes `--label-case`, `numeral` and `code` set
 * tabular figures. `code` is set in the mono face at `--size-body` (the scale has no code size).
 * `math` is set in `--font-math` at `--size-body`, and so is any MathML `<math>` inside it (the
 * browser would otherwise give `<math>` its own face): `<Text role="math"><math>…</math></Text>`,
 * or `<Text as="math" role="math">` for the element itself.
 * The tone picks the ink: `primary`…`faint` are `--text-1`…`--text-4`, `on-solid` is
 * `--action-text`, hue slots `--hue-N`, role slots `--role-N`; no tone inherits. Margin is always
 * 0: spacing belongs to the group around it.
 *
 * `leading`, `size`, `weight` and `case` refine the role. Every rule has no specificity
 * (`:where()`), so a component's class on the same element wins, and it can render any element
 * (`as`) with any native prop and a `ref`, so a control's root or face can be a `Text`.
 *
 * **Tuning knobs.** Set on the Text element's own class (each is reset on every Text, so one set
 * on an ancestor never reaches it): `--text-size` (over the role's size, e.g.
 * `calc(var(--size-label) * 0.9)` or a component's `var(--yh-x-size)`), `--text-weight`,
 * `--text-leading`, `--text-tracking`.
 */
export function Text({
  role = 'body',
  ariaRole,
  tone,
  tabular,
  truncate,
  leading,
  size,
  weight,
  case: textCase,
  as: Tag = 'span',
  className,
  children,
  ...rest
}: TextProps) {
  return (
    <Tag
      className={`lib-text lib-tone${className ? ` ${className}` : ''}`}
      role={ariaRole}
      data-role={role}
      data-tone={toneAttr(tone)}
      data-tabular={tabular === undefined ? undefined : tabular ? '' : 'false'}
      data-truncate={truncate ? '' : undefined}
      data-text-leading={leading}
      data-text-size={size}
      data-text-weight={weight}
      data-text-case={textCase}
      {...rest}
    >
      {children}
    </Tag>
  );
}
