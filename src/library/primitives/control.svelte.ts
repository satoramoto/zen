// The Svelte twin of React's `ControlContext` (Stack.tsx): what the controls inside a cluster
// should look like. A toolbar `Group` sets `CONTROL_TOOLBAR` for its controls; anything that
// floats out of a toolbar (a popover's panel) sets `CONTROL_FIELD` again. A value may be a live
// object (a getter), so a control reading `getControlContext().quiet` in `$derived` follows it.
import { getContext, setContext } from 'svelte';
import { CONTROL_FIELD, type ControlContextValue } from './control';

export { CONTROL_FIELD, CONTROL_TOOLBAR, type ControlContextValue } from './control';

const KEY = Symbol('zen.control');

/** Sets the look the controls inside this component ask of (call during component init). */
export function setControlContext(value: ControlContextValue): ControlContextValue {
  return setContext(KEY, value);
}

/** The look the surrounding cluster asks of a control: `CONTROL_FIELD` outside any. */
export function getControlContext(): ControlContextValue {
  return getContext<ControlContextValue | undefined>(KEY) ?? CONTROL_FIELD;
}
