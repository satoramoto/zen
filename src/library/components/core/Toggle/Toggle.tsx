import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { CONTROL_SIZES, useToggle, type ControlSize } from './useToggle';
import { focusRing } from '../../../primitives/Ring';
import './size.css';
import './Toggle.css';

export { CONTROL_SIZES, useToggle, type ControlSize };

export interface ToggleProps {
  on: boolean;
  onChange(next: boolean): void;
  disabled?: boolean;
  /** The accessible name; falls back to `name`. */
  label?: string;
  /** The caption: over the key when stacked, at the left of the row when inside. */
  name?: string;
  /** Springs back instead of staying down, like `live.button`. */
  momentary?: boolean;
  /** The key's width in px, so a face that says On and Off doesn't change width as it's pressed.
   *  Default: four characters. Inside, the key spans the row. */
  width?: number;
  /** `stacked`: a caption over a lit key. `inside`: one line, the caption at the left and the state
   *  (`children`) at the right; the reading lights, not the whole row. */
  layout?: 'stacked' | 'inside';
  className?: string;
  title?: string;
  /** A sentence for the window's hint strip, on the root as `data-hint`. */
  hint?: string;
  /** The colour it lights in (any CSS colour, e.g. `var(--hue-2)`). Default `--selected`. */
  ink?: string;
  /** The face (stacked) or the reading (inside). */
  children?: ReactNode;
}

/**
 * A latching key: on until pressed again (`aria-pressed`), or, `momentary`, on only while held.
 *
 * **Job.** Turn one thing on or off where it's played from: a mode on a panel of keys (stacked),
 * or a setting on a line of rows (inside), its state read at the row's end.
 *
 * **Behaviour.** Controlled: a press asks through `onChange(!on)` and the key moves when `on`
 * does. Momentary asks for `true` on pointer down (or Space/Enter down) and `false` on release or
 * when the pointer leaves while held; it has no pressed state to report, so it carries no
 * `aria-pressed`, but it still lights while held (`data-on`). Disabled asks nothing. The
 * accessible name is `label`, else `name`.
 *
 * **Parts** (`data-part`): `root`, `caption`, `key` (the button; the theme's `key` material,
 * pressed shadow and lit glow when on, lit in `ink`), `readout` (inside only: the state, which is
 * what lights on a row).
 */
export function Toggle({
  on,
  onChange,
  disabled = false,
  label,
  name,
  momentary = false,
  width,
  layout = 'stacked',
  className,
  title,
  hint,
  ink,
  children,
}: ToggleProps) {
  const inside = layout === 'inside';
  const press = (next: boolean) => {
    if (!disabled) onChange(next);
  };
  // Momentary from the keyboard: held while Space or Enter is down.
  const holdKey = (next: boolean) => (e: KeyboardEvent) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    if (!e.repeat) press(next);
  };
  const style = {
    ...(width === undefined ? {} : { '--lib-toggle-width': `${width}px` }),
    ...(ink === undefined ? {} : { '--lib-toggle-ink': ink }),
  } as CSSProperties;

  return (
    <div
      className={`lib-toggle${className ? ` ${className}` : ''}`}
      data-part="root"
      data-layout={layout}
      data-on={on || undefined}
      data-disabled={disabled || undefined}
      data-hint={hint || undefined}
      style={style}
    >
      {name && (
        <span className="lib-toggle__caption" data-part="caption">
          {name}
        </span>
      )}
      <button
        type="button"
        className={`lib-toggle__key ${focusRing}`}
        data-part="key"
        data-on={on || undefined}
        aria-pressed={momentary ? undefined : on}
        aria-label={label ?? name}
        disabled={disabled}
        title={title}
        onPointerDown={momentary ? () => press(true) : undefined}
        onPointerUp={momentary ? () => press(false) : undefined}
        onPointerLeave={momentary && on ? () => press(false) : undefined}
        onKeyDown={momentary ? holdKey(true) : undefined}
        onKeyUp={momentary ? holdKey(false) : undefined}
        onClick={momentary ? undefined : () => press(!on)}
      >
        {inside ? null : children}
      </button>
      {inside && children !== undefined && (
        <span className="lib-toggle__readout" data-part="readout">
          {children}
        </span>
      )}
    </div>
  );
}

export interface SwitchProps {
  /** What it turns on. Required unless `children` labels it. */
  'aria-label'?: string;
  size?: ControlSize;
  disabled?: boolean;
  /** Controlled; leave it out to let the switch keep its own state from `defaultChecked`. */
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** A name beside it: the switch then sits at the end of a line that labels it, and a click on
   *  the name flips it too (the app's `SwitchRow`). */
  children?: ReactNode;
  /** What it does, as a tooltip (over the whole line when labelled). */
  title?: string;
  className?: string;
}

/**
 * A switch: on or off, taking effect at once.
 *
 * **Job.** A setting that is on or off, read at the end of its line.
 *
 * **Behaviour.** A button with `role="switch"` and `aria-checked`, so a click, Space or Enter
 * flips it. Controlled with `checked`, or its own from `defaultChecked`; `onChange` hears the new
 * state either way. Disabled doesn't flip. With `children` it is a whole line (`<label>`): the
 * name at the start, the switch at the end, the name labelling it.
 *
 * **Parts** (`data-part`): `row` (labelled only), `name`, `switch` (the track: the theme's `well`,
 * filled `--selected` and lit when on), `thumb` (the theme's `handle`, at the trailing end when on).
 */
export function Switch({
  size = 'regular',
  disabled,
  checked,
  defaultChecked = false,
  onChange,
  'aria-label': ariaLabel,
  children,
  title,
  className,
}: SwitchProps) {
  const [on, set] = useToggle(checked, defaultChecked, onChange);
  const labelled = children !== undefined;
  const control = (
    <button
      type="button"
      role="switch"
      className={`lib-switch lib-sized ${focusRing}${!labelled && className ? ` ${className}` : ''}`}
      data-part="switch"
      data-size={size}
      aria-label={ariaLabel}
      aria-checked={on}
      disabled={disabled}
      title={labelled ? undefined : title}
      onClick={() => set(!on)}
    >
      <span className="lib-switch__thumb" data-part="thumb" aria-hidden="true" />
    </button>
  );
  if (!labelled) return control;
  return (
    <label
      className={`lib-switch-row${className ? ` ${className}` : ''}`}
      data-part="row"
      data-size={size}
      data-disabled={disabled || undefined}
      title={title}
    >
      <span className="lib-switch-row__name" data-part="name">
        {children}
      </span>
      {control}
    </label>
  );
}

export default Toggle;
