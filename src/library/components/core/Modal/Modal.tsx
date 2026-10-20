import type { ReactNode } from 'react';
import { Tree } from '../../../view/Tree';
import { modalHandlers, modalView, sheetView, type ModalModelProps, type SheetModelProps } from './Modal.model';
import '../../../primitives/Text.css';
import '../../../primitives/Surface.css';
import '../ActionButton/ActionButton.css';
import './Modal.css';

// The props, the frame and its keys are framework-free, in the model and the `focusTrap` and
// `dialogEscape` stores (`dialog.ts`); this file, `Modal.svelte` and `Sheet.svelte` only hand the
// model's tree to their `Tree`, with the body and the actions as slots.
export type { ModalModelProps, SheetModelProps, SheetSide } from './Modal.model';

export interface ModalProps extends Omit<ModalModelProps, 'onClose'> {
  /** Escape, the scrim, the ×, or an action asking to be let out. */
  onClose(): void;
  /** The buttons along the bottom. The one that does the thing goes first. */
  actions?: ReactNode;
  children?: ReactNode;
}

export interface SheetProps extends ModalProps, Pick<SheetModelProps, 'side' | 'modal'> {}

/**
 * **Job.** The one thing you are doing, over everything you were doing: a question (write this,
 * delete that, are you sure) on an `overlay` layer over a scrim.
 *
 * **Behaviour.** Open by being mounted: there is no `open` prop; mount it while the question is
 * asked (`{asking && <Modal …/>}`) and `onClose` is the one way it asks to go away, from Esc, a
 * click on the scrim (not on the pane), the ×, or a button in `actions`. On mount focus moves into
 * the dialog and Tab and ⇧Tab go round its controls; on unmount focus goes back to the opener
 * (the `focusTrap` store). It is `role="dialog"` with `aria-modal="true"`, named by `label`, else
 * `title`. The × is always there, since Esc and the scrim are both invisible; `actions` is for what
 * the modal is for, and the row is left out when none are passed. Only the topmost of stacked
 * dialogs hears Tab and Esc.
 *
 * **Type.** The root is a body `Text`; the title a `display` `Text` at the heading size; the body
 * a body `Text` at the pane's size (`inherit`), line height 1.45.
 *
 * **Parts.** `scrim`, `dialog` (the focus root, `--lib-modal-width`), `pane` (a `Layer` at
 * `overlay`), `head`, `title`, `close`, `body`, `actions`.
 */
export function Modal({ actions, children, ...props }: ModalProps) {
  return <Tree tree={modalView(props, { actions: Boolean(actions) })} slots={{ children, actions }} handlers={modalHandlers(props)} />;
}

/**
 * **Job.** A panel of settings or tools brought in over whatever view is showing, edge-anchored
 * rather than centred: visual[flow]'s Settings (down the right, full height, over a scrim) and its
 * More effects drawer (along the bottom, leaving the show and the controls behind it usable).
 *
 * **Behaviour.** `Modal`'s API and rules (mounted is open, `onClose` from Esc, the scrim or the ×,
 * focus trapped and restored, named by `label` else `title`), plus `side` (`right` | `bottom`) and
 * `modal`. Modal (the default) draws a scrim that closes it and sets `aria-modal`; non-modal draws
 * none, lets clicks behind it land, and leaves Tab and Esc to another dialog beside it that has
 * focus. The head stays in view while the body scrolls. The × is named "Close <title>".
 *
 * **Parts.** As `Modal`: `scrim` (modal only), `dialog` (`data-side` on the root), `pane`, `head`,
 * `title`, `close`, `body`, `actions`.
 */
export function Sheet({ actions, children, ...props }: SheetProps) {
  return <Tree tree={sheetView(props, { actions: Boolean(actions) })} slots={{ children, actions }} handlers={modalHandlers(props)} />;
}
