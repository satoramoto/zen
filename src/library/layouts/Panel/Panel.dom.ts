// Panel as the DOM renderer draws it: the same tree as `Panel.tsx` and `Panel.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { panelView, type PanelModelProps } from './Panel.model';
import '../../primitives/Text/Text.css';
import '../../primitives/Surface/Surface.css';
import './Panel.css';

type Props = Omit<PanelModelProps, 'aside'> & { aside?: string | DomFill; actions?: DomFill; children?: DomFill };

export const PanelDom = domPart<Props>({}, ({ aside, actions, children, ...props }) => {
  const asideSlot = typeof aside === 'function';
  return {
    tree: panelView({ ...props, aside: typeof aside === 'string' ? aside : undefined }, { children: children !== undefined, actions: actions !== undefined, aside: asideSlot }),
    slots: { children, actions, aside: asideSlot ? (aside as DomFill) : undefined },
  };
});
