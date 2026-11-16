// ActionButton as the DOM renderer draws it: the same tree and handlers as `ActionButton.tsx` and `ActionButton.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { actionButtonHandlers, actionButtonView, type ActionButtonModelProps } from './ActionButton.model';

export const ActionButtonDom = domPart<ActionButtonModelProps & { children?: DomFill }>({ events: ['onPress'] }, ({ children, ...props }) => ({
  tree: actionButtonView(props),
  slots: { children },
  handlers: actionButtonHandlers(props),
}));
