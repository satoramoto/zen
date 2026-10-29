import { h, slot, wire, type Handlers, type Node } from '../../view/Tree.model';
import type { Dismissal, PopupAnchor, PopupWithin } from './Popup.input';

export type { Dismissal, PopupAnchor, PopupBox, PopupWithin } from './Popup.input';
export interface PopupModelProps {
  anchor: PopupAnchor;
  onDismiss(how: Dismissal): void;
  within?: PopupWithin;
  role?: string;
  label?: string;
  id?: string;
  className?: string;
}
export function popupView({ anchor, role, label, id, className }: PopupModelProps): Node {
  return wire(h('div', { id, class: `wdg-popup${className ? ` ${className}` : ''}`, popover: 'manual', role, 'aria-label': label }, slot('children')), {
    bind: [['musicPopup', { anchor: 'anchor', within: 'within', remembered: typeof anchor !== 'function' && !('current' in anchor), onDismiss: 'dismiss' }]],
  });
}
export function popupHandlers(props: PopupModelProps): Handlers {
  return {
    anchor: () => typeof props.anchor === 'function' ? props.anchor() : 'current' in props.anchor ? props.anchor.current : props.anchor,
    within: () => typeof props.within === 'function' ? props.within() : props.within?.current,
    dismiss: props.onDismiss,
  };
}
