import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Tree } from '../../../view/Tree';
import { slot, wire } from '../../../view/Tree.model';
import { actionButtonHandlers, actionButtonView, buttonFaceView, faceWiring, type ActionButtonModelProps, type ActionTone } from './ActionButton.model';
import '../../../primitives/Text.css';
import './ActionButton.css';

// The props, the faces and the press are framework-free, in the model; this file and
// `ActionButton.svelte` only hand the model's tree to their `Tree`.
export type { ActionTone, ActionButtonModelProps, ButtonFaceModelProps } from './ActionButton.model';

export type ButtonFaceProps = ComponentPropsWithRef<'button'> & {
  /** On or off, for a face that is a switch. Set (true or false), the face is a toggle. */
  lit?: boolean;
  /** Smaller than the control height, for dense rows. Left out, the face is `--control-h` tall. */
  size?: 'small' | 'medium';
  /** How loudly it asks to be noticed. Default `normal`. */
  tone?: ActionTone;
};

/**
 * **Job.** The shared pressable face for actions, switches and custom held-input gestures: a
 * `<button>` drawn in the theme's `key` material, holding whatever the caller puts in it (an icon,
 * a word, both).
 *
 * **Behaviour.** Every native button prop passes through; `type` defaults to `button`. It is a
 * toggle when `lit` or `aria-pressed` is set, and on (`data-on`) when `lit` is true or
 * `aria-pressed` is true. Held, or on, it presses in (`--mat-key-pressed`); on, it also lights in
 * the accent (`--mat-lit-glow`). `tone`: `normal` a key; `quiet` no key until pointed at or
 * focused (furniture: a ×, a delete on a title bar); `danger` an ordinary key until hover, then in
 * `--danger`.
 *
 * **Parts.** `face` (the button; a caller may rename it with its own `data-part`; `data-tone`, `data-size`, `data-on`, `data-kind` button|toggle).
 */
export function ButtonFace({ lit, size, tone, className, children, role, 'aria-pressed': pressed, type, ref, ...props }: ButtonFaceProps) {
  // The native props are attributes and events on the face; the event callbacks get the DOM event.
  const { attrs, on, handlers } = faceWiring(props);
  const face = buttonFaceView({ lit, size, tone, className, ariaRole: role, pressed, type }, attrs, slot('children'));
  return (
    <Tree
      tree={wire(face, { on, bind: [['ref', { onRef: 'ref' }]] })}
      slots={{ children }}
      handlers={{
        ...handlers,
        ref: (element: HTMLButtonElement | null) => {
          if (typeof ref === 'function') ref(element);
          else if (ref) ref.current = element;
        },
      }}
    />
  );
}

export interface ActionButtonProps extends ActionButtonModelProps {
  children?: ReactNode;
}

/**
 * **Job.** A thing you press that is not a parameter (delete, close, add, export), with any
 * children: an icon, a word, both. zen's `Button` takes a text label; this takes arbitrary content.
 *
 * **Behaviour.** A press calls `onPress(event)`; nothing is left behind (no on state, no
 * `aria-pressed`). The accessible name is `label`, else the caption `name`, else the children.
 * `width` fixes the face's width in px. `hint` lands on the root as `data-hint`. Tones as
 * `ButtonFace`; there is deliberately no primary tone (the screen decides which action matters).
 *
 * **Parts.** root (`lib-action-button`, `data-hint`), `caption` (the `name`, when given), `face`
 * (the `ButtonFace`).
 */
export function ActionButton({ children, ...props }: ActionButtonProps) {
  return <Tree tree={actionButtonView(props)} slots={{ children }} handlers={actionButtonHandlers(props)} />;
}
