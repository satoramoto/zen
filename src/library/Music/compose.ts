// Assemble independently owned models without embedding callbacks in component props or adding DOM.
import { isComponent, isNode, isSlot, isSlotFill, type Child, type Handlers, type Root } from '../view/Tree.model';

export interface MusicView {
  tree: Root;
  handlers: Handlers;
}

/** Namespace a model's callback keys when several instances share one outer Tree. */
export function scopedView(tree: Root, handlers: Handlers, prefix: string, slots: Record<string, (Child | null)[]> = {}): MusicView {
  const rename = (key: string) => Object.hasOwn(handlers, key) ? `${prefix}:${key}` : key;
  const params = (value: unknown): unknown => {
    if (typeof value === 'string') return Object.hasOwn(handlers, value) ? rename(value) : value;
    if (Array.isArray(value)) return value.map(params);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, params(item)]));
    return value;
  };
  const list = (children: (Child | null)[]): (Child | null)[] => children.flatMap((child) => child === null ? [null] : draw(child));
  const draw = (child: Child): (Child | null)[] => {
    if (typeof child === 'string') return [child];
    if (isSlot(child)) return slots[child.slot] ?? [child];
    if (isComponent(child)) return [{
      ...child,
      ...(child.on ? { on: Object.fromEntries(Object.entries(child.on).map(([event, key]) => [event, rename(key)])) } : {}),
      ...(child.slots ? { slots: Object.fromEntries(Object.entries(child.slots).map(([name, fill]) => [name, isSlotFill(fill) ? (slots[fill.slot] ?? fill) : list(fill)])) } : {}),
    }];
    if (isNode(child)) return [{
      ...child,
      ...(child.on ? { on: Object.fromEntries(Object.entries(child.on).map(([event, key]) => [event, rename(key)])) } : {}),
      ...(child.bind ? { bind: child.bind.map(([store, data]) => [store, params(data) as object]) } : {}),
      ...(child.children ? { children: list(child.children) } : {}),
    }];
    return [child];
  };
  const nodes = Array.isArray(tree) ? list(tree) : draw(tree);
  return {
    tree: nodes.length === 1 && nodes[0] !== null ? nodes[0] : nodes,
    handlers: Object.fromEntries(Object.entries(handlers).map(([key, callback]) => [rename(key), callback])),
  };
}
