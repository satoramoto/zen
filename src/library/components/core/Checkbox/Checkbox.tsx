import type { ReactNode } from 'react';
import { Tree } from '../../../view/Tree';
import { checkboxHandlers, checkboxView, checkMarkNode, dashMarkNode, type CheckModelProps } from './Checkbox.model';
import '../../../primitives/Text.css';
import '../Toggle/size.css';
import './Checkbox.css';

// The props, the tree and the handlers are framework-free, in the model; an uncontrolled input's
// starting state is the `checkDefault.ts` store. This file and `Checkbox.svelte` only hand the
// model's tree to their `Tree`.
export type { ToggleValue, CheckModelProps } from './Checkbox.model';

/** The props a checkbox and a radio button share. */
export interface CheckProps extends CheckModelProps {
  /** The label beside the box; without one, give `aria-label`. */
  children?: ReactNode;
}

export type CheckboxProps = CheckProps;

/** The check, on a 16-unit box: it scales with the box. */
export function CheckMark() {
  return <Tree tree={checkMarkNode()} />;
}

/** The mixed state's dash, on the same 16-unit box. */
export function DashMark() {
  return <Tree tree={dashMarkNode()} />;
}

/**
 * A checkbox: on, off, or mixed.
 *
 * **Job.** Say yes or no to one thing in a list of options, or stand for a group some of which
 * are on (mixed).
 *
 * **Behaviour.** A real `<input type="checkbox">` laid over the drawn box, so Space, the label,
 * forms and assistive tech work natively. Mixed is the input's `indeterminate` (read as "mixed");
 * a click on a mixed box checks it, and only the app brings mixed back. Controlled with `checked`
 * or its own from `defaultChecked`; `onChange` hears true or false. What is drawn follows the input
 * (`:checked`, `:indeterminate`), never a copy of it.
 *
 * **Type.** The root label is a body `Text` at line height 1.2, caption-sized at `mini` and
 * `small` (knobs on `.lib-check`, shared with Radio).
 *
 * **Parts** (`data-part`): `root` (the label), `box`, `input`, `face` (the theme's `well`; filled
 * `--selected` and lit when checked or mixed), `check` and `dash` (in `--selected-text`), `label`.
 */
export function Checkbox({ children, ...props }: CheckboxProps) {
  return <Tree tree={checkboxView(props, { label: children !== undefined })} slots={{ children }} handlers={checkboxHandlers(props)} />;
}

export default Checkbox;
