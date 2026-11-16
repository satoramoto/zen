// Gate as the DOM renderer draws it: the same tree and handlers as `Gate.tsx` and `Gate.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { gateHandlers, gateState, gateView, type GateModelProps } from './Gate.model';

type Props = GateModelProps & { title?: DomFill; message?: DomFill; children?: DomFill };

export const GateDom = domPart<Props>({ events: ['onSubmit'] }, ({ title, message, children, ...props }, use) => {
  const own = use.state(gateState);
  const slots = { title: title !== undefined, message: message !== undefined, children: children !== undefined };
  return { tree: gateView(props, own.get(), slots), slots: { title, message, children }, handlers: gateHandlers(props, own) };
});
