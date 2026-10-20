// The control context's values, framework-free: the one definition. Stack.tsx imports and
// re-exports them for its React `ControlContext`; the Svelte renderers take them from here
// (control.svelte.ts).

/** What the controls inside a cluster should look like: set by where they sit (a toolbar asks for
 *  `quiet`), read by a control that has a quiet look (see Stack.tsx's `ControlContext`). */
export interface ControlContextValue {
  /** In a toolbar: drop field chrome, keep the hit target and the behaviour. */
  readonly quiet: boolean;
}
export const CONTROL_FIELD: ControlContextValue = { quiet: false };
export const CONTROL_TOOLBAR: ControlContextValue = { quiet: true };
