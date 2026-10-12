import type { ComponentPropsWithRef, CSSProperties, MouseEvent, ReactNode } from 'react';
import { focusRing } from '../../../primitives/Ring';
import './ActionButton.css';

export type ActionTone = 'normal' | 'quiet' | 'danger';

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
export function ButtonFace({ lit, size, tone = 'normal', className = '', children, 'aria-pressed': pressed, ...props }: ButtonFaceProps) {
  const toggle = lit !== undefined || pressed !== undefined;
  const on = lit ?? (pressed === true || pressed === 'true');
  return (
    <button
      data-part="face"
      {...props}
      type={props.type ?? 'button'}
      aria-pressed={pressed}
      className={`lib-action-button-face ${focusRing}${className ? ` ${className}` : ''}`}
      data-kind={toggle ? 'toggle' : 'button'}
      data-tone={tone}
      data-size={size}
      data-on={on ? '' : undefined}
    >
      {children}
    </button>
  );
}

export interface ActionButtonProps {
  /** It happened. The event carries the modifiers held while it did. */
  onPress(event: MouseEvent<HTMLButtonElement>): void;
  disabled?: boolean;
  /** For assistive technology. Defaults to the caption, then to the children. */
  label?: string;
  /** Printed caption above, for a button that sits in a row beside captioned controls. */
  name?: string;
  tone?: ActionTone;
  /** In px. The children are the caller's and can be any length. */
  width?: number;
  className?: string;
  title?: string;
  /** A sentence for a hint strip, on the root as `data-hint`. Left out, a strip falls back to `title`. */
  hint?: string;
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
export function ActionButton({ onPress, disabled = false, label, name, tone = 'normal', width, className, title, hint, children }: ActionButtonProps) {
  return (
    <div
      className={`lib-action-button${className ? ` ${className}` : ''}`}
      data-hint={hint}
      style={(width === undefined ? {} : { '--lib-action-button-width': `${width}px` }) as CSSProperties}
    >
      {name && (
        <span className="lib-action-button__caption" data-part="caption">
          {name}
        </span>
      )}
      <ButtonFace type="button" tone={tone} aria-label={label ?? name} disabled={disabled} title={title} onClick={onPress}>
        {children}
      </ButtonFace>
    </div>
  );
}
