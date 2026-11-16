// Icon as the DOM renderer draws it: the same tree as `Icon.tsx` and `Icon.svelte`; every other prop lands on its root.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { slot } from '../../foundation/view/Tree.model';
import { iconNode, type IconModelProps } from './Icon.model';
import '../Text/Text.css';
import './Icon.css';

type Props = Omit<IconModelProps, 'className'> & { class?: string; className?: string; children?: DomFill } & Record<string, unknown>;

export const IconDom = domPart<Props>({}, ({ size, tone, label, viewBox, class: cls, className, children, ...rest }) => ({
  tree: iconNode({ size, tone, label, viewBox, className: cls ?? className }, {}, slot('children')),
  slots: { children },
  root: rest,
}));
