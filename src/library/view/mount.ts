// What both renderers do to an element once it exists, framework-free: attach its `on` handlers,
// apply its `bind` stores and set its form properties (`value`, `checked`, `indeterminate`). `Tree.tsx` calls it from a layout effect, `Tree.svelte` from an attachment;
// neither holds any of this logic.
import { PROPERTIES, type Handler, type Handlers, type Node } from './Tree.model';
import type { StoreBinding, Stores } from './stores';

/** What a renderer passes: the callbacks by key and the store registry. */
export interface MountContext {
  handlers: Handlers;
  stores: Stores;
}

/** A mounted element: `update` after every render (new node or handlers), `destroy` on unmount. */
export interface Mounted {
  update(node: Node, context: MountContext): void;
  destroy(): void;
}

interface Bound {
  name: string;
  params: string;
  binding: StoreBinding<object>;
}

/**
 * Applies `node.bind` (stores first, in order, so a store's capture listener runs before an `on`
 * handler) and `node.on` (native listeners that call the latest handler by key) to `element`.
 * A store gets `update(params)` when its params change or the handlers do; a changed list of store
 * names rebinds them all.
 */
export function mountNode(element: Element, node: Node, context: MountContext): Mounted {
  let current = node;
  let ctx = context;
  const handler = (key: string): Handler | undefined => ctx.handlers[key];

  let bound: Bound[] = [];
  const bindAll = () => {
    bound = (current.bind ?? []).map(([name, params]) => {
      const store = ctx.stores[name];
      if (!store) throw new Error(`view: no store named "${name}" (register it in src/library/view/stores.ts)`);
      return { name, params: JSON.stringify(params), binding: store(element as HTMLElement, params, handler) ?? {} };
    });
  };
  const unbindAll = () => {
    for (const { binding } of bound) binding.destroy?.();
    bound = [];
  };

  const listeners = new Map<string, EventListener>();
  const listen = () => {
    const on = current.on ?? {};
    for (const [type, listener] of listeners) {
      if (on[type] !== undefined) continue;
      element.removeEventListener(type, listener);
      listeners.delete(type);
    }
    for (const type of Object.keys(on)) {
      if (listeners.has(type)) continue;
      const listener: EventListener = (event) => {
        const key = current.on?.[type];
        if (key !== undefined) ctx.handlers[key]?.(event);
      };
      element.addEventListener(type, listener);
      listeners.set(type, listener);
    }
  };

  // Form state as properties: set when the tree's value differs from the element's, so a user's
  // edit stands until the tree says otherwise.
  const properties = () => {
    const target = element as unknown as Record<string, unknown>;
    for (const [name, value] of Object.entries(current.attrs ?? {})) {
      if (!PROPERTIES.has(name)) continue;
      const next = name === 'value' ? (value ?? '') : value !== undefined;
      if (target[name] !== next) target[name] = next;
    }
  };

  bindAll();
  listen();
  properties();

  return {
    update(next, nextContext) {
      const handlersChanged = nextContext.handlers !== ctx.handlers;
      current = next;
      ctx = nextContext;
      const names = (next.bind ?? []).map(([name]) => name).join('\n');
      if (names !== bound.map(({ name }) => name).join('\n')) {
        unbindAll();
        bindAll();
      } else {
        bound.forEach((entry, i) => {
          const params = next.bind![i][1];
          const text = JSON.stringify(params);
          if (text === entry.params && !handlersChanged) return;
          entry.params = text;
          entry.binding.update?.(params);
        });
      }
      listen();
      properties();
    },
    destroy() {
      unbindAll();
      for (const [type, listener] of listeners) element.removeEventListener(type, listener);
      listeners.clear();
    },
  };
}
