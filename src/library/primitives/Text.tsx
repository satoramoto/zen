import type { AllHTMLAttributes, AriaRole, CSSProperties, ReactNode, Ref } from 'react';
import { Tree } from '../view/Tree';
import { slot } from '../view/Tree.model';
import { textNode, type TextModelProps } from './Text.model';
import './Text.css';

// The roles, tones and refinements are framework-free, in the model; `Text.svelte` renders the same view.
export {
  TEXT_ROLES,
  TEXT_TONES,
  TEXT_LEADINGS,
  TEXT_WEIGHTS,
  TEXT_CASES,
  toneAttr,
  textView,
  type TextRole,
  type TextTone,
  type TextLeading,
  type TextWeight,
  type TextCase,
  type TextSize,
  type TextModelProps,
} from './Text.model';

export interface TextProps extends Omit<AllHTMLAttributes<HTMLElement>, 'role' | 'size' | 'as'>, Omit<TextModelProps, 'ariaRole' | 'className'> {
  /** The ARIA role, since `role` is the type role. */
  ariaRole?: AriaRole;
  /** The element to render (a tag); default `span`. */
  as?: string;
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
  role,
  ariaRole,
  tone,
  tabular,
  truncate,
  leading,
  size,
  weight,
  case: textCase,
  as,
  className,
  children,
  ...rest
}: TextProps) {
  return (
    <Tree
      tree={textNode({ role, ariaRole, tone, tabular, truncate, leading, size, weight, case: textCase, className, as }, {}, slot('children'))}
      slots={{ children }}
      {...rest}
    />
  );
}
