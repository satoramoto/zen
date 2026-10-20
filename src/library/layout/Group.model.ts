// Group's model: its root Stack (class, role, name, grid area), its body Stack, and the label it
// shows. No framework: `Group.tsx` (React) and `Group.svelte` (Svelte) both render these.
import type { StackAlign, StackModelProps } from '../primitives/Stack.model';
import type { Step } from '../primitives/step';
import type { StyledView } from './Region.model';

/** What Group decides from, in any framework (each renderer adds its label, aside and children). */
export interface GroupModelProps {
  /** The group's accessible name; also its visible label unless a label is given. */
  name: string;
  /** How the controls flow: a row (default) or a column. */
  direction?: 'row' | 'column';
  /** Wrap controls onto more lines when the row is full. */
  wrap?: boolean;
  /** The space between the controls as a scale step. Default `2`. */
  gap?: Step;
  /** How the controls line up across the flow (`align-items`); unset stretches them. */
  align?: StackAlign;
  /** The grid area this group fills inside its region. */
  area?: string;
  /** A toolbar (`role="toolbar"`): the controls inside take their quiet look. */
  toolbar?: boolean;
  /** Classes added after the group's own. */
  className?: string;
}

/** The root Stack's own props: a column, gap step 1. */
export const GROUP_ROOT_STACK: StackModelProps = { direction: 'column', gap: 1 };

/** The root: `lib-group` plus the caller's class (handed to its Stack), its role and name, and its grid area. */
export function groupView({ name, area, toolbar = false, className }: GroupModelProps): StyledView {
  return {
    className: `lib-group${className ? ` ${className}` : ''}`,
    attrs: { role: toolbar ? 'toolbar' : 'group', 'aria-label': name, 'data-part': 'group' },
    style: { 'grid-area': area || undefined },
  };
}

/** The body Stack's class. */
export const GROUP_BODY_CLASS = 'lib-group__body';

/** The body Stack's props: how the controls flow (its class is `GROUP_BODY_CLASS`). */
export function groupBodyStack({ direction = 'row', wrap = false, gap = 2, align }: Pick<GroupModelProps, 'direction' | 'wrap' | 'gap' | 'align'>):Omit<StackModelProps, 'className'> {
  return { direction, wrap, gap, align };
}

/** The label shown: none for `false`, else the label, else the name. */
export function groupLabel<L>(name: string, label: L | false | undefined): L | string | null {
  return label === false ? null : (label ?? name);
}
