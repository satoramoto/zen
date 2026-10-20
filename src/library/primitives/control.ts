// The control context's values, framework-free, for the Svelte renderers (control.svelte.ts).
// They mirror `ControlContextValue`, `CONTROL_FIELD` and `CONTROL_TOOLBAR` in Stack.tsx (which
// imports React, so Svelte code can't take them from there); keep the two in step.

/** What the controls inside a cluster should look like (see Stack.tsx). */
export interface ControlContextValue {
  /** In a toolbar: drop field chrome, keep the hit target and the behaviour. */
  readonly quiet: boolean;
}
export const CONTROL_FIELD: ControlContextValue = { quiet: false };
export const CONTROL_TOOLBAR: ControlContextValue = { quiet: true };
