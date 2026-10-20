// An on/off value, controlled or the control's own, framework-free: shared by `Switch` and
// `Disclosure`. The binding keeps the own value as view state (`music/viewState.ts`) and passes it
// in with its setter; the model's handlers ask through `set`.

/** The value a control shows, and how a flip reaches it. */
export interface OwnToggle {
  /** `value` when the parent owns it, else the control's own. */
  current: boolean;
  /** With `value` set the parent owns it and this only asks (through `onChange`); without it the
   *  control's own value moves too. */
  set(next: boolean): void;
}

/** `value` (controlled) or `own` (the control's view state, set through `setOwn`). */
export function ownToggle(
  value: boolean | undefined,
  own: boolean,
  setOwn: (next: boolean) => void,
  onChange?: (next: boolean) => void,
): OwnToggle {
  return {
    current: value ?? own,
    set(next) {
      if (value === undefined) setOwn(next);
      onChange?.(next);
    },
  };
}
