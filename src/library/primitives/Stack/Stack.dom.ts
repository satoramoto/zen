// Stack as the DOM renderer draws it: the same tree as `Stack.tsx` and `Stack.svelte`; every other prop lands on its root.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { slot } from '../../foundation/view/Tree.model';
import { stackNode, type StackModelProps } from './Stack.model';
import './Stack.css';

type Props = Omit<StackModelProps, 'className'> & { as?: string; class?: string; className?: string; children?: DomFill } & Record<string, unknown>;

export const StackDom = domPart<Props>({}, ({ direction, gap, align, justify, wrap, as, class: cls, className, children, ...rest }) => ({
  tree: stackNode({ direction, gap, align, justify, wrap, className: cls ?? className, as }, {}, slot('children')),
  slots: { children },
  root: rest,
}));
