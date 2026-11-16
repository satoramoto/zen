// Opaque as the DOM renderer draws it: the same tree as `Opaque.tsx` and `Opaque.svelte`; every other prop lands on its root.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { opaqueTree } from '../Hole/Hole.model';

type Props = { class?: string; className?: string; style?: string; children?: DomFill };

export const OpaqueDom = domPart<Props>({}, ({ class: cls, className, style, children }) => ({ tree: opaqueTree(cls ?? className, style), slots: { children } }));
