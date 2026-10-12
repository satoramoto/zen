import { useEffect, useRef, type ReactNode } from 'react';
import type { ControlSize } from '../Toggle/useToggle';
import '../Toggle/size.css';
import './Checkbox.css';

/** A checkbox's or radio button's value: on, off, or mixed (some of what it stands for is on). */
export type ToggleValue = boolean | 'mixed';

/** The props a checkbox and a radio button share. */
export interface CheckProps {
  /** The label beside the box; without one, give `aria-label`. */
  children?: ReactNode;
  'aria-label'?: string;
  size?: ControlSize;
  disabled?: boolean;
  /** Controlled; leave it out to let the input keep its own state, starting from `defaultChecked`. */
  checked?: ToggleValue;
  defaultChecked?: ToggleValue;
  /** The input's new state: true or false (a click always ends mixed). */
  onChange?: (checked: boolean) => void;
  name?: string;
  value?: string;
}

export type CheckboxProps = CheckProps;

/** The check, on a 16-unit box: it scales with the box. */
export function CheckMark() {
  return (
    <svg className="lib-check__mark lib-check__check" data-part="check" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.6 8.4 7 10.75 11.4 5.3" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The mixed state's dash, on the same 16-unit box. */
export function DashMark() {
  return (
    <svg className="lib-check__mark lib-check__dash" data-part="dash" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="4.75" y="7" width="6.5" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

/**
 * A checkbox: on, off, or mixed.
 *
 * **Job.** Say yes or no to one thing in a list of options, or stand for a group some of which
 * are on (mixed).
 *
 * **Behaviour.** A real `<input type="checkbox">` laid over the drawn box, so Space, the label,
 * forms and assistive tech work natively. Mixed is the input's `indeterminate` (read as "mixed");
 * a click on a mixed box checks it, and only the app brings mixed back. Controlled with `checked`
 * or its own from `defaultChecked`; `onChange` hears true or false. What is drawn follows the input
 * (`:checked`, `:indeterminate`), never a copy of it.
 *
 * **Parts** (`data-part`): `root` (the label), `box`, `input`, `face` (the theme's `well`; filled
 * `--selected` and lit when checked or mixed), `check` and `dash` (in `--selected-text`), `label`.
 */
export function Checkbox({
  children,
  size = 'regular',
  disabled,
  checked,
  defaultChecked = false,
  onChange,
  name,
  value,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  const input = useRef<HTMLInputElement>(null);
  const controlled = checked !== undefined;
  // Mixed has no attribute: it is set on the element, from the prop each render, or once from the default.
  useEffect(() => {
    if (input.current && controlled) input.current.indeterminate = checked === 'mixed';
  });
  useEffect(() => {
    // Only the first value counts, as for defaultChecked.
    if (input.current && !controlled) input.current.indeterminate = defaultChecked === 'mixed';
  }, []);
  return (
    <label className="lib-check lib-checkbox lib-sized" data-part="root" data-size={size} data-disabled={disabled ? '' : undefined}>
      <span className="lib-check__box" data-part="box">
        <input
          ref={input}
          className="lib-check__input"
          data-part="input"
          type="checkbox"
          name={name}
          value={value}
          aria-label={ariaLabel}
          disabled={disabled}
          {...(controlled ? { checked: checked === true } : { defaultChecked: defaultChecked === true })}
          onChange={(e) => onChange?.(e.currentTarget.checked)}
        />
        <span className="lib-check__face" data-part="face" aria-hidden="true" />
        <CheckMark />
        <DashMark />
      </span>
      {children !== undefined && (
        <span className="lib-check__label" data-part="label">
          {children}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
