import type { CSSProperties, ReactNode } from 'react';
import type { Step } from '../primitives/step';
import { CONTROL_TOOLBAR, ControlContext, type StackAlign } from '../primitives/Stack';
import { Tree } from '../view/Tree';
import { groupView } from './Group.model';
import { cssText, isSlotContent } from './Region.model';
import '../primitives/Stack.css';
import '../primitives/Text.css';
import './Group.css';

// The tree and the shown label are framework-free, in the model; this file and `Group.svelte` only
// hand its tree to their `Tree`, with the label, aside and controls as slots.
export { groupView, groupBodyStack, groupLabel, GROUP_ROOT_STACK, GROUP_BODY_CLASS, type GroupModelProps, type GroupDrawProps } from './Group.model';

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
  /**
   * A toolbar (`role="toolbar"`): the controls inside take their quiet look (a Select is text and
   * a caret, not a field) through `ControlContext`; they never take a per-use style for it.
   */
  toolbar?: boolean;
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
 *
 * **Toolbar.** `toolbar` makes it a `role="toolbar"` and provides `ControlContext { quiet: true }`
 * to everything inside, so its controls drop their field chrome (macOS toolbar convention: text
 * with a chevron, a faint hover and press tint). The context changes the look; the controls keep
 * their size, hit target, keys and menus.
 */
export function Group({ label, aside, style, toolbar = false, children, ...props }: GroupProps) {
  const tree = groupView(
    {
      ...props,
      toolbar,
      label: typeof label === 'string' || label === false ? label : undefined,
      aside: typeof aside === 'string' ? aside : undefined,
      style: cssText(style),
    },
    { label: isSlotContent(label), aside: isSlotContent(aside) },
  );
  // React's context reaches the controls through the slot: only the body's are a toolbar's.
  const body = toolbar ? <ControlContext.Provider value={CONTROL_TOOLBAR}>{children}</ControlContext.Provider> : children;
  return <Tree tree={tree} slots={{ label: label === false ? undefined : label, aside, children: body }} />;
}
