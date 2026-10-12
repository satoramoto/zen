import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import type { HueSlot } from '../components/core/hue';
import './Text.css';

/** The type roles, each a face, weight, size, tracking and case from the contract. */
export const TEXT_ROLES = ['display', 'numeral', 'heading', 'body', 'label', 'caption', 'code'] as const;
export type TextRole = (typeof TEXT_ROLES)[number];

/** The ink tones: the four text levels, the palette's signal colours, ink on a solid action fill,
 *  the four categorical hue slots and the two role hues. */
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

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'role'> {
  /** The type role; default `body`. (This is the type role, not an ARIA role.) */
  role?: TextRole;
  /** The ink; omitted, the colour is inherited. */
  tone?: TextTone;
  /** Tabular (fixed-width) figures. Always on for `numeral` and `code`. */
  tabular?: boolean;
  /** One line, cut with an ellipsis; may shrink inside a flex or grid track. */
  truncate?: boolean;
  /** The element to render; default `span`. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * **Job.** Text in a role. The role decides the face (`--font-sans`, `--font-display`,
 * `--font-mono`, `--font-readout`), weight, size, tracking and case from the contract; `display`
 * takes `--tracking-display`, `label` takes `--label-case`, `numeral` and `code` always set
 * tabular figures. `code` is set in the mono face at `--size-body` (the scale has no code size).
 * The tone picks the ink: `primary`…`faint` are `--text-1`…`--text-4`, `on-solid` is
 * `--action-text`, hue slots `--hue-N`, role slots `--role-N`; no tone inherits. Margin is always
 * 0: spacing belongs to the group around it.
 */
export function Text({ role = 'body', tone, tabular, truncate, as: Tag = 'span', className, children, ...rest }: TextProps) {
  return (
    <Tag
      className={`lib-text lib-tone${className ? ` ${className}` : ''}`}
      data-role={role}
      data-tone={toneAttr(tone)}
      data-tabular={tabular ? '' : undefined}
      data-truncate={truncate ? '' : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
