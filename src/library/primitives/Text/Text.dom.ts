// Text as the DOM renderer draws it: the same tree as `Text.tsx` and `Text.svelte`; every other prop lands on its root.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { slot } from '../../foundation/view/Tree.model';
import { textNode, type TextModelProps } from './Text.model';

type Props = Omit<TextModelProps, 'className'> & { as?: string; class?: string; className?: string; children?: DomFill } & Record<string, unknown>;

export const TextDom = domPart<Props>({}, ({ role, ariaRole, tone, tabular, truncate, leading, size, weight, case: textCase, as, class: cls, className, children, ...rest }) => ({
  tree: textNode({ role, ariaRole, tone, tabular, truncate, leading, size, weight, case: textCase, className: cls ?? className, as }, {}, slot('children')),
  slots: { children },
  root: rest,
}));
