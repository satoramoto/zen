// The contexts a tree provides with a `Context` node (`component('Context', { name, value })`), by
// name, with the value a part reads outside any: framework-free, for the DOM renderer, which
// carries them down the tree itself. `Context.tsx` and `Context.svelte` map the same names to
// React's and Svelte's contexts.
import { CONTROL_FIELD } from '../../primitives/control';
import { NO_FORM } from '../../layouts/Assembly/forms.model';
import { SURFACE_PLAYING } from '../../layouts/Workspace/surfaceMode';

/** Every context's value outside any `Context` node. A new context is one line here too. */
export const CONTEXT_DEFAULTS: Record<string, unknown> = {
  /** The look controls take inside a cluster (`ControlContextValue`): a toolbar's quiet one. */
  control: CONTROL_FIELD,
  /** Inside an `Opaque` (true): no surface draws a shader. */
  opaque: false,
  /** The assembled region's form store (`FormStore`). */
  form: NO_FORM,
  /** The surface's mode round each pane it draws (`SurfaceMode`). */
  surface: SURFACE_PLAYING,
};

/** The contexts in force at a point of a tree, by name. */
export type Contexts = Readonly<Record<string, unknown>>;

/** `name`'s value in `contexts`, else its default; an unknown name throws, naming this file. */
export function readContext<T = unknown>(contexts: Contexts, name: string): T {
  if (!(name in CONTEXT_DEFAULTS)) throw new Error(`view: no context named "${name}" (add it to src/library/foundation/view/contexts.ts, Context.tsx and Context.svelte)`);
  return (name in contexts ? contexts[name] : CONTEXT_DEFAULTS[name]) as T;
}

/** `contexts` with `name` set to `value`, for the subtree under a `Context` node. */
export function provideContext(contexts: Contexts, name: string, value: unknown): Contexts {
  readContext(contexts, name);
  return { ...contexts, [name]: value };
}
