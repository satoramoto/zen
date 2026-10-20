/**
 * An uncontrolled checkbox's or radio's starting state, framework-free: on mount it sets the
 * input's `defaultChecked` and `checked` (and `indeterminate` for mixed), once, as React's
 * `defaultChecked` does; later params are ignored, so the user's clicks stand. A controlled input
 * carries `checked` / `indeterminate` in the tree's attrs instead. Registered as the `checkDefault`
 * store (`src/library/view/stores.ts`); Checkbox's and Radio's trees bind it on the input.
 */
export interface CheckDefaultParams {
  /** Starts checked. */
  checked: boolean;
  /** Starts mixed (`indeterminate`). */
  mixed: boolean;
}

/** Sets `node`'s (an `<input>`'s) starting state; only the first params count. */
export function bindCheckDefault(node: HTMLElement, params: CheckDefaultParams): { update(): void; destroy(): void } {
  const input = node as HTMLInputElement;
  input.defaultChecked = params.checked;
  input.checked = params.checked;
  if (params.mixed) input.indeterminate = true;
  return { update() {}, destroy() {} };
}
