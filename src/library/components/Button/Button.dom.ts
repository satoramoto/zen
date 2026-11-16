// Button as the DOM renderer draws it: the same tree and handlers as `Button.tsx` and `Button.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { buttonHandlers, buttonView, type ButtonModelProps } from './Button.model';
import '../../primitives/Text/Text.css';
import './Button.css';

export const ButtonDom = domPart<ButtonModelProps & { icon?: DomFill }>({ events: ['onPress', 'onHold', 'onLongPress', 'onLongRelease'] }, ({ icon, ...props }) => ({
  tree: buttonView(props, { icon: icon !== undefined }),
  slots: { icon },
  handlers: buttonHandlers(props),
}));
