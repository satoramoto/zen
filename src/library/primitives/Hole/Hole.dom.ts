// Hole as the DOM renderer draws it: the same tree as `Hole.tsx` and `Hole.svelte`; every other prop lands on its root.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { slot } from '../../foundation/view/Tree.model';
import { holeNode } from './Hole.model';
import '../Surface/Surface.css';

type Props = { class?: string; className?: string; style?: string; name?: string; children?: DomFill };

export const HoleDom = domPart<Props>({}, ({ class: cls, className, style, name, children }) => ({
  tree: holeNode(cls ?? className, name, {}, slot('children')),
  slots: { children },
  root: { style },
}));
