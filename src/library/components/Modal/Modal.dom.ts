// Modal and Sheet as the DOM renderer draws them: the same trees and handlers as `Modal.tsx`, `Modal.svelte` and `Sheet.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { modalHandlers, modalView, sheetView, type ModalModelProps, type SheetModelProps } from './Modal.model';

export const ModalDom = domPart<ModalModelProps & { actions?: DomFill; children?: DomFill }>({ events: ['onClose'] }, ({ actions, children, ...props }) => ({
  tree: modalView(props, { actions: actions !== undefined }),
  slots: { children, actions },
  handlers: modalHandlers(props),
}));

export const SheetDom = domPart<SheetModelProps & { actions?: DomFill; children?: DomFill }>({ events: ['onClose'] }, ({ actions, children, ...props }) => ({
  tree: sheetView(props, { actions: actions !== undefined }),
  slots: { children, actions },
  handlers: modalHandlers(props),
}));
