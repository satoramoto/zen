// The store contract, apart from the registry so that a registry of a few stores (`coreStores.ts`)
// needs nothing else: a bound store, a registered store, and `keyed`, which adapts a plain
// `bindX(node, params)` store to a tree. `stores.ts` re-exports all of it.
import type { Handler } from './Tree.model';

/** A bound store: `update` with new params, `destroy` when the element goes. */
export interface StoreBinding<P> {
  update?(params: P): void;
  destroy?(): void;
}

/** A registered store: applied to `node` with `params`; `handler(key)` is the latest callback for a key. */
export type Store<P extends object = any> = (node: HTMLElement, params: P, handler: (key: string) => Handler | undefined) => StoreBinding<P> | void;

/** A registry of stores by name. */
export type Stores = Record<string, Store>;

/** `P` with its callback fields `F` given as handler keys. */
export type Keyed<P, F extends keyof P> = Omit<P, F> & { [K in F]?: string };

/**
 * A plain `bindX(node, params)` store as a tree store: the callback fields `fields` hold handler
 * keys in the tree, and the store reads them as the latest handlers, at the moment it calls them.
 */
export function keyed<P extends object, F extends keyof P & string>(
  bind: (node: HTMLElement, params: P) => StoreBinding<P>,
  fields: readonly F[],
): Store<Keyed<P, F>> {
  return (node, initial, handler) => {
    let params: Keyed<P, F> = initial;
    const callbacks = new Set<string>(fields);
    const live = new Proxy({} as P, {
      get(_, name) {
        const value = (params as Record<string | symbol, unknown>)[name];
        return typeof name === 'string' && callbacks.has(name) ? (typeof value === 'string' ? handler(value) : undefined) : value;
      },
    });
    const binding = bind(node, live);
    return {
      update(next) {
        params = next;
        binding.update?.(live);
      },
      destroy: () => binding.destroy?.(),
    };
  };
}
