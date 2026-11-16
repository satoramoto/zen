// Group as the DOM renderer draws it: the same tree as `Group.tsx` and `Group.svelte`; every other prop lands on its root.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { styleAttr } from '../../foundation/view/style';
import { groupView, type GroupModelProps } from './Group.model';
import { isSlotContent } from '../Region/Region.model';
import '../../primitives/Stack/Stack.css';
import '../../primitives/Text/Text.css';
import './Group.css';

type Props = Omit<GroupModelProps, 'className' | 'label' | 'aside' | 'style'> & {
  label?: string | DomFill | false;
  aside?: string | DomFill;
  class?: string;
  className?: string;
  style?: string | object;
  children?: DomFill;
};

export const GroupDom = domPart<Props>({}, ({ label, aside, toolbar = false, class: cls, className, style, children, ...props }) => ({
  tree: groupView(
    {
      ...props,
      toolbar,
      className: cls ?? className,
      style: typeof style === 'string' ? style : styleAttr(style),
      label: typeof label === 'string' || label === false ? label : undefined,
      aside: typeof aside === 'string' ? aside : undefined,
    },
    { label: isSlotContent(label), aside: isSlotContent(aside) },
  ),
  slots: { label: typeof label === 'function' ? label : undefined, aside: typeof aside === 'function' ? aside : undefined, children },
}));
