import { useState } from 'react';
import { DashMark, type CheckProps } from '../Checkbox/Checkbox';
import '../Toggle/size.css';
import '../Checkbox/Checkbox.css';
import './Radio.css';

export type RadioProps = CheckProps;

/**
 * A radio button: one choice of several.
 *
 * **Job.** Pick exactly one of a few options shown side by side (Fill, Fit, Stretch).
 *
 * **Behaviour.** A real `<input type="radio">`, so radios sharing a `name` keep one checked and
 * the arrow keys move the choice along the group, natively. Controlled with `checked` or its own
 * from `defaultChecked`; `onChange` hears `true` when it is picked. HTML's radios have no mixed
 * state, so mixed is drawn only (a dash, `data-mixed`) until the radio is picked: the input reads
 * as not checked.
 *
 * **Parts** (`data-part`): `root` (the label), `box`, `input`, `face` (Checkbox's `well` face,
 * round), `dot` and `dash` (in `--selected-text`), `label`.
 */
export function Radio({
  children,
  size = 'regular',
  disabled,
  checked,
  defaultChecked = false,
  onChange,
  name,
  value,
  'aria-label': ariaLabel,
}: RadioProps) {
  const controlled = checked !== undefined;
  const [ownMixed, setOwnMixed] = useState(defaultChecked === 'mixed');
  const mixed = controlled ? checked === 'mixed' : ownMixed;
  return (
    <label
      className="lib-check lib-radio lib-sized"
      data-part="root"
      data-size={size}
      data-mixed={mixed ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
    >
      <span className="lib-check__box" data-part="box">
        <input
          className="lib-check__input"
          data-part="input"
          type="radio"
          name={name}
          value={value}
          aria-label={ariaLabel}
          disabled={disabled}
          {...(controlled ? { checked: checked === true } : { defaultChecked: defaultChecked === true })}
          onChange={(e) => {
            setOwnMixed(false);
            onChange?.(e.currentTarget.checked);
          }}
        />
        <span className="lib-check__face" data-part="face" aria-hidden="true" />
        <span className="lib-radio__dot" data-part="dot" aria-hidden="true" />
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

export default Radio;
