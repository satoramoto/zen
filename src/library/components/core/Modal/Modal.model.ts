// Modal's and Sheet's model: their props, the tree they draw (the root, the scrim, the dialog, the
// pane with its head, body and actions) and the handlers that tree names. No framework: `Modal.tsx`
// and `Sheet.tsx` (React) and `Modal.svelte` and `Sheet.svelte` (Svelte) each hand `modalView` or
// `sheetView` to their `Tree`. Focus and Esc are the `focusTrap` and `dialogEscape` stores
// (`dialog.ts`, registered in `src/library/view/stores.ts`).
import { layerSurface } from '../../../layout/Layer.model';
import { focusRing } from '../../../primitives/Ring';
import { textNode } from '../../../primitives/Text.model';
import { component, h, slot, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';

/** Every Modal prop but its slots (`children`, `actions`). */
export interface ModalModelProps {
  /** Printed along the top, and the dialog's accessible name. */
  title: string;
  /** Escape, the scrim, the ×, or an action asking to be let out. */
  onClose?: () => void;
  /** In px. Wide enough for a paragraph and a short list by default. */
  width?: number;
  /** For assistive technology, where the printed title is not the whole story. */
  label?: string;
  className?: string;
}

export type SheetSide = 'right' | 'bottom';

/** Every Sheet prop but its slots. */
export interface SheetModelProps extends ModalModelProps {
  /** Where it comes in: `right` a full-height panel down the window's right (Settings), `bottom` a
   *  panel along the bottom, centred (a drawer such as More effects). Default `right`. */
  side?: SheetSide;
  /** Default true: a scrim behind it that closes it when tapped, and the page behind marked
   *  unusable (`aria-modal`). False for a drawer that leaves the page usable beside it: no scrim,
   *  clicks behind it still land, and Tab still keeps to it. */
  modal?: boolean;
}

/** Which slots the binding fills: the actions row is drawn only when there are actions. */
export interface ModalSlots {
  actions?: boolean;
}

interface FrameProps extends ModalModelProps {
  kind: 'modal' | 'sheet';
  side?: SheetSide;
  modal: boolean;
  closeLabel: string;
  closeTitle?: string;
}

/** The ×: a 9px cross in the text colour. */
const cross = () =>
  h('svg', { width: '9', height: '9', viewBox: '0 0 9 9', 'aria-hidden': 'true' }, h('path', { d: 'M1 1l7 7M8 1l-7 7', stroke: 'currentColor', 'stroke-width': '1.2', fill: 'none' }));

/** Both forms' tree: what `ActionButton`'s `ButtonFace` drew for the × is drawn inline here. */
function frameView({ kind, side, modal, closeLabel, closeTitle, title, width, label, className }: FrameProps, { actions = false }: ModalSlots): Node {
  return textNode(
    { as: 'div', role: 'body', className: 'lib-modal' },
    { 'data-kind': kind, 'data-side': side, 'data-modal': modal ? '' : undefined },
    when(modal, () => wire(h('div', { class: 'lib-modal__scrim', 'data-part': 'scrim', 'aria-hidden': 'true' }), { on: { click: 'close' } })),
    wire(
      h(
        'div',
        {
          tabindex: '-1',
          role: 'dialog',
          'aria-modal': modal ? 'true' : undefined,
          'aria-label': label ?? title,
          class: `lib-modal__dialog${className ? ` ${className}` : ''}`,
          'data-part': 'dialog',
          style: width === undefined ? undefined : styleText({ '--lib-modal-width': `${width}px` }),
        },
        // What `<Layer level="overlay">` draws (`layerView`): a Surface, by name, so a pack's shader
        // material still draws on it.
        component(
          'Surface',
          { ...layerSurface({ level: 'overlay', className: 'lib-modal__pane' }), as: 'div', 'data-part': 'pane' },
          {
            slots: {
              children: [
                h(
                  'div',
                  { class: 'lib-modal__head', 'data-part': 'head' },
                  textNode({ as: 'h2', role: 'display', size: 'heading', className: 'lib-modal__title' }, { 'data-part': 'title' }, title),
                  wire(
                    textNode(
                      { as: 'button', role: 'label', leading: 'tight', case: 'none', className: `lib-action-button-face ${focusRing} lib-modal__close` },
                      {
                        'data-part': 'close',
                        'aria-label': closeLabel,
                        title: closeTitle,
                        type: 'button',
                        'data-kind': 'button',
                        'data-tone': 'quiet',
                        'data-size': 'medium',
                      },
                      cross(),
                    ),
                    { on: { click: 'close' } },
                  ),
                ),
                // The pane's own size (a caller may set one on it) carries through: `inherit`.
                textNode({ as: 'div', role: 'body', size: 'inherit', className: 'lib-modal__body' }, { 'data-part': 'body' }, slot('children')),
                when(actions, () => h('div', { class: 'lib-modal__actions', 'data-part': 'actions' }, slot('actions'))),
              ],
            },
          },
        ),
      ),
      { bind: [['focusTrap', {}], ['dialogEscape', { onClose: 'close' }]] },
    ),
  );
}

/**
 * The tree Modal draws: a body Text root (`data-kind="modal"`, `data-modal`), the scrim (a click
 * calls `close`), the dialog (`role="dialog"`, `aria-modal`, named by `label` else `title`, the
 * `focusTrap` and `dialogEscape` stores), and in it an `overlay` layer (a Surface, by name) holding the head
 * (title and the × "Close"), the body (the `children` slot) and, when `slots.actions`, the actions row.
 */
export function modalView(props: ModalModelProps, slots: ModalSlots = {}): Node {
  return frameView({ ...props, kind: 'modal', modal: true, closeLabel: 'Close' }, slots);
}

/**
 * The tree Sheet draws: Modal's, with `data-kind="sheet"`, `data-side` (default `right`), the
 * scrim and `aria-modal` only when `modal` (default true), and the × named "Close <title>",
 * titled "Close (Esc)".
 */
export function sheetView({ side = 'right', modal = true, ...props }: SheetModelProps, slots: ModalSlots = {}): Node {
  return frameView({ ...props, kind: 'sheet', side, modal, closeLabel: `Close ${props.title.toLowerCase()}`, closeTitle: 'Close (Esc)' }, slots);
}

/** The callbacks the tree names: `close` (the scrim, the ×, Esc) calls `onClose`. */
export function modalHandlers(props: ModalModelProps): Handlers {
  return { close: () => props.onClose?.() };
}
