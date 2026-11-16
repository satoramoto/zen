// Popover as the DOM renderer draws it: the same tree and handlers as `Popover.tsx` and `Popover.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { CONTROL_FIELD } from '../../primitives/control';
import { popoverHandlers, popoverView, type PopoverBindingProps } from './Popover.model';

// A popover is a new surface: controls in it are fields again, even when it opens from a toolbar.
export const PopoverDom = domPart<PopoverBindingProps & { children?: DomFill }>({ events: ['onDismiss'] }, ({ children, ...props }, use) => {
  use.provide('control', CONTROL_FIELD);
  return { tree: popoverView({ ...props, hover: props.hover !== undefined }), slots: { children }, handlers: popoverHandlers(props) };
});
