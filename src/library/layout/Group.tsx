import type { CSSProperties, ReactNode } from 'react';
import type { Step } from '../primitives/step';
import { Text } from '../primitives/Text';
import { Stack, type StackAlign } from '../primitives/Stack';
import './Group.css';

export interface GroupProps {
  /** The group's accessible name; also its visible label unless `label` is given. */
  name: string;
  /** A visible label; `false` hides it (the name stays for assistive tech). */
  label?: ReactNode | false;
  /** Header content on the right: a page switch, a count. */
  aside?: ReactNode;
  /** How the controls flow: a row (default) or a column. */
  direction?: 'row' | 'column';
  /** Wrap controls onto more lines when the row is full. */
  wrap?: boolean;
  /** The space between the controls as a scale step: `0` none, 1–6 are `--space-1` to `--space-6`. Default `2`. */
  gap?: Step;
  /** How the controls line up across the flow (`align-items`); unset stretches them. */
  align?: StackAlign;
  /** The grid area this group fills inside its region. */
  area?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * **Job.** A labelled cluster of controls inside a region: the transport block, one fader page's
 * strips, a row of One Touch numbers. Every group's header looks the same, and the scale sets
 * its spacing, so clusters read alike across the app.
 *
 * **Spacing.** A Group is a `Stack` plus a label: its root is a column `Stack` (gap step 1)
 * holding the head and the body, and the body is a `Stack` too. The space between controls is
 * `gap`, a scale step, never a margin on a control. `direction`, `wrap` and `align` arrange them;
 * the group paints nothing.
 */
export function Group({ name, label, aside, direction = 'row', wrap = false, gap = 2, align, area, className, style, children }: GroupProps) {
  const shown = label === false ? null : (label ?? name);
  return (
    <Stack
      className={`lib-group${className ? ` ${className}` : ''}`}
      direction="column"
      gap={1}
      role="group"
      aria-label={name}
      data-part="group"
      style={area ? { gridArea: area, ...style } : style}
    >
      {(shown || aside) && (
        <div className="lib-group__head" data-part="head">
          {shown && (
            <Text size="caption" weight="strong" case="label" className="lib-group__label">
              {shown}
            </Text>
          )}
          {aside && <span className="lib-group__aside">{aside}</span>}
        </div>
      )}
      <Stack className="lib-group__body" data-part="body" direction={direction} wrap={wrap} gap={gap} align={align}>
        {children}
      </Stack>
    </Stack>
  );
}
