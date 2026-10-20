// A context a tree provides to what it draws inside, by name: `component('Context', { name:
// 'control', value: CONTROL_TOOLBAR }, { slots: { children: [...] } })`. React's contexts are
// providers around their children, so a binding can't set one without markup; this registered
// component is that markup, once, for every tree. `Context.svelte` sets the same by name.
import { createElement, type Context as ReactContext, type ReactNode } from 'react';
import { ControlContext } from '../primitives/Stack';
import { OpaqueContext } from '../primitives/opaque';
import { FormContext } from '../layout/assembly/forms';

/** Every context a tree can provide, by name. A new one is one line here and in `Context.svelte`.
 *  Built on first use, since the files holding the contexts import this one (an import cycle). */
let contexts: Record<string, ReactContext<any>> | undefined;
const registry = (): Record<string, ReactContext<any>> =>
  (contexts ??= {
    /** The look controls take inside a cluster (`ControlContextValue`, Stack.tsx): a toolbar's quiet one. */
    control: ControlContext,
    /** Inside an `Opaque` (true): no surface draws a shader. */
    opaque: OpaqueContext,
    /** The assembled region's form store (`FormStore`, `FormProvider` in layout/assembly/forms.tsx; `FormScope.svelte` in Svelte). */
    form: FormContext,
  });

export interface ContextProps {
  /** The context's name (`control`, `opaque`). */
  name: string;
  /** What it provides: plain data. */
  value: unknown;
  children?: ReactNode;
}

/** Provides the context named `name` with `value` to `children`. Draws no element. */
export function Context({ name, value, children }: ContextProps) {
  const context = registry()[name];
  if (!context) throw new Error(`view: no context named "${name}" (add it to src/library/view/Context.tsx and Context.svelte)`);
  return createElement(context.Provider, { value }, children);
}
