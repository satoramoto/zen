// Group's model: the tree a renderer draws (its root Stack with its class, role, name and grid
// area; the header with the label and aside; the body Stack holding the `children` slot). No
// framework: `Group.tsx` (React) and `Group.svelte` (Svelte) each hand `groupView` to their `Tree`.
import { stackView, type StackAlign, type StackModelProps } from '../primitives/Stack.model';
import type { Step } from '../primitives/step';
import { textView } from '../primitives/Text.model';
import { h, slot, styleText, when, type Node } from '../view/Tree.model';
import { joinStyle } from './Region.model';

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

/** Everything `groupView` draws from: the model's props, the label and aside as text (a node or a
 *  snippet is a slot instead, `GroupSlots`; `false` hides the label) and the caller's inline style. */
export interface GroupDrawProps extends GroupModelProps {
  /** A visible label as text; `false` hides it; unset shows the name. */
  label?: string | false;
  /** Header content on the right, as text. */
  aside?: string;
  /** The caller's inline style, after the group's own. */
  style?: string;
}

/** Which of the header's slots the binding fills (a label or aside that isn't text). */
export interface GroupSlots {
  label?: boolean;
  aside?: boolean;
}

/** The root Stack's own props: a column, gap step 1. */
export const GROUP_ROOT_STACK: StackModelProps = { direction: 'column', gap: 1 };

/** The body Stack's class. */
export const GROUP_BODY_CLASS = 'lib-group__body';

/** The body Stack's props: how the controls flow (its class is `GROUP_BODY_CLASS`). */
export function groupBodyStack({ direction = 'row', wrap = false, gap = 2, align }: Pick<GroupModelProps, 'direction' | 'wrap' | 'gap' | 'align'>): Omit<StackModelProps, 'className'> {
  return { direction, wrap, gap, align };
}

/** The label shown: none for `false`, else the label, else the name. */
export function groupLabel<L>(name: string, label: L | false | undefined): L | string | null {
  return label === false ? null : (label ?? name);
}

/**
 * The tree Group draws: the root (a column Stack, gap step 1, `lib-group` plus the caller's class,
 * a `group` or `toolbar` named by `name`, its grid area), its header when it shows a label or an
 * aside (the label as a caption `Text`), and the body Stack (`lib-group__body`) holding `children`.
 */
export function groupView(props: GroupDrawProps, slots: GroupSlots = {}): Node {
  const { name, label, aside, area, toolbar = false, className, style } = props;
  const root = stackView({ ...GROUP_ROOT_STACK, className: `lib-group${className ? ` ${className}` : ''}` });
  const body = stackView({ ...groupBodyStack(props), className: GROUP_BODY_CLASS });
  const shown = slots.label && label !== false ? slot('label') : groupLabel(name, label);
  const hasAside = Boolean(slots.aside || aside);
  const text = textView({ size: 'caption', weight: 'strong', case: 'label', className: 'lib-group__label' });
  return h(
    'div',
    {
      class: root.className,
      ...root.attrs,
      role: toolbar ? 'toolbar' : 'group',
      'aria-label': name,
      'data-part': 'group',
      style: joinStyle(styleText({ 'grid-area': area || undefined }), style),
    },
    when(Boolean(shown) || hasAside, () =>
      h(
        'div',
        { class: 'lib-group__head', 'data-part': 'head' },
        when(Boolean(shown), () => h('span', { class: text.className, ...text.attrs }, shown)),
        when(hasAside, () => h('span', { class: 'lib-group__aside' }, slots.aside ? slot('aside') : (aside ?? null))),
      ),
    ),
    h('div', { class: body.className, ...body.attrs, 'data-part': 'body' }, slot('children')),
  );
}
