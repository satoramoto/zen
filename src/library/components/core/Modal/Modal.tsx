import { useRef, type CSSProperties, type ReactNode } from 'react';
import { Layer } from '../../../layout/Layer';
import { ButtonFace } from '../ActionButton/ActionButton';
import { Text } from '../../../primitives/Text';
import { useModal } from './useModal';
import './Modal.css';

export interface ModalProps {
  /** Printed along the top, and the dialog's accessible name. */
  title: string;
  /** Escape, the scrim, the ×, or an action asking to be let out. */
  onClose(): void;
  /** In px. Wide enough for a paragraph and a short list by default. */
  width?: number;
  /** The buttons along the bottom. The one that does the thing goes first. */
  actions?: ReactNode;
  /** For assistive technology, where the printed title is not the whole story. */
  label?: string;
  children?: ReactNode;
  className?: string;
}

export type SheetSide = 'right' | 'bottom';

export interface SheetProps extends ModalProps {
  /** Where it comes in: `right` a full-height panel down the window's right (Settings), `bottom` a
   *  panel along the bottom, centred (a drawer such as More effects). Default `right`. */
  side?: SheetSide;
  /** Default true: a scrim behind it that closes it when tapped, and the page behind marked
   *  unusable (`aria-modal`). False for a drawer that leaves the page usable beside it: no scrim,
   *  clicks behind it still land, and Tab still keeps to it. */
  modal?: boolean;
}

const Cross = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true">
    <path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.2" fill="none" />
  </svg>
);

interface FrameProps extends ModalProps {
  kind: 'modal' | 'sheet';
  side?: SheetSide;
  modal: boolean;
  closeLabel: string;
  closeTitle?: string;
}

function Frame({ kind, side, modal, closeLabel, closeTitle, title, onClose, width, actions, label, children, className }: FrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  useModal(ref, onClose);
  return (
    <Text as="div" role="body" className="lib-modal" data-kind={kind} data-side={side} data-modal={modal ? '' : undefined}>
      {modal && <div className="lib-modal__scrim" data-part="scrim" aria-hidden="true" onClick={onClose} />}
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal={modal ? 'true' : undefined}
        aria-label={label ?? title}
        className={`lib-modal__dialog${className ? ` ${className}` : ''}`}
        data-part="dialog"
        style={(width === undefined ? {} : { '--lib-modal-width': `${width}px` }) as CSSProperties}
      >
        <Layer level="overlay" className="lib-modal__pane" data-part="pane">
          <div className="lib-modal__head" data-part="head">
            <Text as="h2" role="display" size="heading" className="lib-modal__title" data-part="title">
              {title}
            </Text>
            <ButtonFace tone="quiet" size="medium" className="lib-modal__close" data-part="close" aria-label={closeLabel} title={closeTitle} onClick={onClose}>
              <Cross />
            </ButtonFace>
          </div>
          {/* The pane's own size (a caller may set one on it) carries through: `inherit`. */}
          <Text as="div" role="body" size="inherit" className="lib-modal__body" data-part="body">
            {children}
          </Text>
          {actions && (
            <div className="lib-modal__actions" data-part="actions">
              {actions}
            </div>
          )}
        </Layer>
      </div>
    </Text>
  );
}

/**
 * **Job.** The one thing you are doing, over everything you were doing: a question (write this,
 * delete that, are you sure) on an `overlay` layer over a scrim.
 *
 * **Behaviour.** Open by being mounted: there is no `open` prop; mount it while the question is
 * asked (`{asking && <Modal …/>}`) and `onClose` is the one way it asks to go away, from Esc, a
 * click on the scrim (not on the pane), the ×, or a button in `actions`. On mount focus moves into
 * the dialog and Tab and ⇧Tab go round its controls; on unmount focus goes back to the opener
 * (`useModal`). It is `role="dialog"` with `aria-modal="true"`, named by `label`, else `title`.
 * The × is always there, since Esc and the scrim are both invisible; `actions` is for what the
 * modal is for, and the row is left out when none are passed. Only the topmost of stacked dialogs
 * hears Tab and Esc.
 *
 * **Type.** The root is a body `Text`; the title a `display` `Text` at the heading size; the body
 * a body `Text` at the pane's size (`inherit`), line height 1.45.
 *
 * **Parts.** `scrim`, `dialog` (the focus root, `--lib-modal-width`), `pane` (a `Layer` at
 * `overlay`), `head`, `title`, `close`, `body`, `actions`.
 */
export function Modal(props: ModalProps) {
  return <Frame {...props} kind="modal" modal closeLabel="Close" />;
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
export function Sheet({ side = 'right', modal = true, ...props }: SheetProps) {
  return <Frame {...props} kind="sheet" side={side} modal={modal} closeLabel={`Close ${props.title.toLowerCase()}`} closeTitle="Close (Esc)" />;
}
