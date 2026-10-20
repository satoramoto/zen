// A plain `bindX(node, params)` store as a Svelte action (`actionOf`), for the actions
// `svelte.ts` makes public (`longPress`, `knobInput`), so no store needs a per-component action
// file. A converted component binds its stores in its tree instead.
import type { StoreBinding } from './stores';

/** A plain store: listens on `node` with `params`, updated with new ones, destroyed at the end. */
export type Bind<P> = (node: HTMLElement, params: P) => StoreBinding<P>;

/** `bind` as a Svelte action (`use:x={params}`, or `{@attach fromAction(x, () => params)}`). */
export function actionOf<P>(bind: Bind<P>) {
  return (node: HTMLElement, params?: P) => {
    const binding = bind(node, params ?? ({} as P));
    return { update: (next?: P) => binding.update?.(next ?? ({} as P)), destroy: () => binding.destroy?.() };
  };
}
