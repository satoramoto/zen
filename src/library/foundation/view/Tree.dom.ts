// The DOM renderer of a view tree (`Tree.model.ts`): the third binding, beside `Tree.tsx` (React)
// and `Tree.svelte` (Svelte), drawing the same DOM with no framework. It creates the elements, fills
// the slots, draws registered parts (`domComponents.ts`) and applies each element's `on` handlers,
// `bind` stores and form properties through `mountNode` (mount.ts), as the other two do. An update
// patches what is there: children are matched by `childKey` (a key, else the position), so an
// element keeps its identity, its focus and its stores' state while its attributes change.
//
// Elements and text are drawn bare. A slot, a part and a `Context` node end with an empty comment,
// the anchor what they draw is placed before, as Svelte's anchors are; the parity serializer skips
// comments. Stores mount once their elements are in the DOM, children before parents (React's
// layout-effect order), and a tree drawn while a store runs waits for the stores already queued.
import { SVG_NS, VOID, childKey, componentProps, domAttrs, isComponent, isNode, isSlot, isSlotFill, type Child, type ComponentNode, type Handlers, type Node as TreeNode, type Root, type Slot } from './Tree.model';
import { mountNode, type Mounted } from './mount';
import type { Stores } from './keyed';
import { provideContext, type Contexts } from './contexts';
import { styleAttr } from './style';

/** What a drawn thing gives its parent: the DOM nodes it holds, in order, and its teardown. */
export interface Drawn {
  nodes(): globalThis.Node[];
  destroy(): void;
}

/** A drawn slot fill: given the slot's arguments again on every update. */
export interface DrawnFill extends Drawn {
  update(args: unknown[]): void;
}

/** What fills a slot: draws into `parent` before `before` with the slot's arguments. */
export type DomFill = (parent: globalThis.Node, before: globalThis.Node | null, args: unknown[]) => DrawnFill;

/** The theme a scope publishes to the parts inside it (`zen-theme`): read with `use.scope()`. */
export interface DomScope {
  facets: { materials: { shaders?: unknown } };
  principles?: unknown;
  /** The pack's id, when the scope names one. */
  pack?: string;
  mode?: 'light' | 'dark';
}

/** What every part drawn in a tree shares: the stores, the parts by name, the contexts in force and the theme scope. */
export interface DomEnv {
  stores: Stores;
  components: (name: string) => DomPart;
  contexts: Contexts;
  scope: DomScope | null;
  svg: boolean;
}

/** One tree's context: the env, and the tree's own slots and handlers. */
export interface DomContext extends DomEnv {
  slots: Record<string, DomFill | undefined>;
  handlers: Handlers;
}

/** A mounted part: new props (and env) on every update of the tree that draws it. */
export interface DomPartInstance extends Drawn {
  update(props: Record<string, unknown>, env: DomEnv): void;
}

/** A registered part, as the DOM renderer draws it (`domPart`, dom.ts). */
export interface DomPart {
  mount(parent: globalThis.Node, before: globalThis.Node | null, props: Record<string, unknown>, env: DomEnv): DomPartInstance;
}

/** What a binding puts on its root besides the tree: native attributes, `on*` listeners and a
 *  `ref` on an element root; props on a part root (Svelte's `{...rest}`, React's `...native`). */
export type RootProps = Record<string, unknown>;

/** A mounted tree. */
export interface MountedTree extends Drawn {
  update(tree: Root, context: DomContext, root?: RootProps): void;
}

// The stores' mounts, queued while a tree is drawn and run once its nodes are in place.
let queue: (() => void)[] | null = null;

/** Runs `draw`, then every store mount it queued (and those they queue), in order. */
export function batch<T>(draw: () => T): T {
  if (queue) return draw();
  queue = [];
  try {
    const result = draw();
    for (let i = 0; i < queue.length; i++) queue[i]();
    return result;
  } finally {
    queue = null;
  }
}

const later = (run: () => void) => (queue ? queue.push(run) : run());

/** Draws `tree` into `parent` before `before` (null: at the end). `root` lands on its root. */
export function mountTree(parent: globalThis.Node, before: globalThis.Node | null, tree: Root, context: DomContext, root?: RootProps): MountedTree {
  return batch(() => {
    const list = childList(parent, before);
    list.update(Array.isArray(tree) ? tree : [tree], context, Array.isArray(tree) ? undefined : root);
    return {
      update: (next, nextContext, nextRoot) => batch(() => list.update(Array.isArray(next) ? next : [next], nextContext, Array.isArray(next) ? undefined : nextRoot)),
      nodes: () => list.nodes(),
      destroy: () => list.destroy(),
    };
  });
}

/** A drawn child: patched in place by `update` (false when it can't be: a new tag or part). */
interface Instance extends Drawn {
  update(child: Child, context: DomContext, root?: RootProps): boolean;
}

/** A run of children in `parent`, before `end`, matched by `childKey` on update. */
function childList(parent: globalThis.Node, end: globalThis.Node | null) {
  let items: { key: string; instance: Instance }[] = [];
  return {
    update(children: (Child | null)[], context: DomContext, root?: RootProps) {
      const old = new Map(items.map((item) => [item.key, item]));
      const next: { key: string; instance: Instance }[] = [];
      children.forEach((child, i) => {
        if (child === null) return;
        const key = childKey(child, i);
        const extra = children.length === 1 ? root : undefined;
        const found = old.get(key);
        old.delete(key);
        if (found && found.instance.update(child, context, extra)) {
          next.push(found);
          return;
        }
        found?.instance.destroy();
        next.push({ key, instance: draw(child, parent, end, context, extra) });
      });
      for (const { instance } of old.values()) instance.destroy();
      items = next;
      // Put every node in order, back to front, leaving one a store moved elsewhere (a portal).
      let after = end;
      for (let i = items.length - 1; i >= 0; i--) {
        const nodes = items[i].instance.nodes();
        for (let j = nodes.length - 1; j >= 0; j--) {
          const node = nodes[j];
          if (node.parentNode !== parent) continue;
          if (node.nextSibling !== after) parent.insertBefore(node, after);
          after = node;
        }
      }
    },
    nodes: () => items.flatMap(({ instance }) => instance.nodes()),
    destroy() {
      for (const { instance } of items) instance.destroy();
      items = [];
    },
  };
}

function draw(child: Child, parent: globalThis.Node, before: globalThis.Node | null, context: DomContext, root?: RootProps): Instance {
  if (typeof child === 'string') return drawText(child, parent, before);
  if (isSlot(child)) return drawSlot(child, parent, before, context);
  if (isComponent(child)) return child.component === 'Context' ? drawContext(child, parent, before, context) : drawPart(child, parent, before, context, root);
  return drawElement(child, parent, before, context, root);
}

function drawText(text: string, parent: globalThis.Node, before: globalThis.Node | null): Instance {
  const node = document.createTextNode(text);
  parent.insertBefore(node, before);
  return {
    update(child) {
      if (typeof child !== 'string') return false;
      if (node.data !== child) node.data = child;
      return true;
    },
    nodes: () => [node],
    destroy: () => node.remove(),
  };
}

const anchor = () => document.createComment('');

function drawSlot(first: Slot, parent: globalThis.Node, before: globalThis.Node | null, context: DomContext): Instance {
  const end = anchor();
  parent.insertBefore(end, before);
  let fill = context.slots[first.slot];
  let drawn = fill ? fill(parent, end, first.args ?? []) : null;
  return {
    update(child, next) {
      if (typeof child !== 'object' || !isSlot(child)) return false;
      const nextFill = next.slots[child.slot];
      if (nextFill === fill && drawn) drawn.update(child.args ?? []);
      else {
        drawn?.destroy();
        fill = nextFill;
        drawn = fill ? fill(end.parentNode ?? parent, end, child.args ?? []) : null;
      }
      return true;
    },
    nodes: () => [...(drawn?.nodes() ?? []), end],
    destroy() {
      drawn?.destroy();
      drawn = null;
      end.remove();
    },
  };
}

/** A part's slot filled with a subtree of this tree: drawn with this tree's context, the latest
 *  subtree and context each time the part draws the slot again. */
function subtreeFill(host: { children: (Child | null)[]; context: DomContext }): DomFill {
  return (parent, before) => {
    const list = childList(parent, before);
    list.update(host.children, host.context);
    return {
      update: () => list.update(host.children, host.context),
      nodes: () => list.nodes(),
      destroy: () => list.destroy(),
    };
  };
}

/** A `Context` node: its children drawn with the context it names set. */
function drawContext(first: ComponentNode, parent: globalThis.Node, before: globalThis.Node | null, context: DomContext): Instance {
  const end = anchor();
  parent.insertBefore(end, before);
  const list = childList(parent, end);
  const within = (node: ComponentNode, ctx: DomContext): [(Child | null)[], DomContext] => {
    const { name, value } = node.props as { name: string; value: unknown };
    const contexts = provideContext(ctx.contexts, name, value);
    const fill = node.slots?.children;
    const children = fill === undefined ? [] : isSlotFill(fill) ? [fill] : fill;
    return [children, { ...ctx, contexts }];
  };
  list.update(...within(first, context));
  return {
    update(child, next) {
      if (typeof child !== 'object' || !isComponent(child) || child.component !== 'Context') return false;
      list.update(...within(child, next));
      return true;
    },
    nodes: () => [...list.nodes(), end],
    destroy() {
      list.destroy();
      end.remove();
    },
  };
}

const envOf = ({ stores, components, contexts, scope, svg }: DomContext): DomEnv => ({ stores, components, contexts, scope, svg });

function drawPart(first: ComponentNode, parent: globalThis.Node, before: globalThis.Node | null, context: DomContext, root?: RootProps): Instance {
  const name = first.component;
  const part = context.components(name);
  const end = anchor();
  parent.insertBefore(end, before);
  const hosts = new Map<string, { children: (Child | null)[]; context: DomContext; fill: DomFill }>();
  const propsOf = (node: ComponentNode, ctx: DomContext, extra?: RootProps) => {
    const props = componentProps(node, (key) => ctx.handlers[key]);
    for (const [slotName, fill] of Object.entries(node.slots ?? {})) {
      if (isSlotFill(fill)) {
        props[slotName] = ctx.slots[fill.slot];
        continue;
      }
      let host = hosts.get(slotName);
      if (!host) {
        const made = { children: fill, context: ctx } as { children: (Child | null)[]; context: DomContext; fill: DomFill };
        made.fill = subtreeFill(made);
        hosts.set(slotName, (host = made));
      }
      host.children = fill;
      host.context = ctx;
      props[slotName] = host.fill;
    }
    return { ...props, ...extra };
  };
  const instance = part.mount(parent, end, propsOf(first, context, root), envOf(context));
  return {
    update(child, next, extra) {
      if (typeof child !== 'object' || !isComponent(child) || child.component !== name || child.key !== first.key) return false;
      instance.update(propsOf(child, next, extra), envOf(next));
      return true;
    },
    nodes: () => [...instance.nodes(), end],
    destroy() {
      instance.destroy();
      end.remove();
    },
  };
}

/** Sets `next`'s attributes on `element`, removing those of `previous` it lacks. */
function patchAttrs(element: Element, previous: Record<string, string>, next: Record<string, string>) {
  for (const name of Object.keys(previous)) if (!(name in next)) element.removeAttribute(name);
  for (const [name, value] of Object.entries(next)) if (previous[name] !== value || element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/** A node's attributes as the DOM gets them, then the root's native ones (strings, numbers and
 *  booleans; `on*` functions and `ref` aside). */
function attrsOf(node: TreeNode, root?: RootProps): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(domAttrs(node.attrs))) out[name] = value === true ? '' : value;
  for (const [name, value] of Object.entries(root ?? {})) {
    if (name === 'ref' || value === undefined || value === null || typeof value === 'function') continue;
    const attr = name === 'className' ? 'class' : name;
    if (typeof value === 'object') {
      const style = name === 'style' ? styleAttr(value) : undefined;
      if (style !== undefined) out.style = style;
      continue;
    }
    if (value === false) delete out[attr];
    else out[attr] = value === true ? '' : String(value);
  }
  return out;
}

/** The root's `on*` functions as DOM listeners, by event name (`onclick`, `onClick` → `click`). */
function listenersOf(root?: RootProps): Record<string, (event: Event) => void> {
  const out: Record<string, (event: Event) => void> = {};
  for (const [name, value] of Object.entries(root ?? {})) if (/^on[A-Za-z]/.test(name) && typeof value === 'function') out[name.slice(2).toLowerCase()] = value as (event: Event) => void;
  return out;
}

function drawElement(first: TreeNode, parent: globalThis.Node, before: globalThis.Node | null, context: DomContext, firstRoot?: RootProps): Instance {
  const svg = context.svg || first.tag === 'svg';
  const element = svg ? document.createElementNS(SVG_NS, first.tag) : document.createElement(first.tag);
  let node = first;
  let ctx = context;
  let attrs = attrsOf(first, firstRoot);
  patchAttrs(element, {}, attrs);
  let rootListeners = listenersOf(firstRoot);
  const listened = new Map<string, EventListener>();
  const listenRoot = () => {
    for (const [type, listener] of listened) {
      if (rootListeners[type]) continue;
      element.removeEventListener(type, listener);
      listened.delete(type);
    }
    for (const type of Object.keys(rootListeners)) {
      if (listened.has(type)) continue;
      const listener: EventListener = (event) => rootListeners[type]?.(event);
      element.addEventListener(type, listener);
      listened.set(type, listener);
    }
  };
  listenRoot();
  let ref = typeof firstRoot?.ref === 'function' ? (firstRoot.ref as (element: Element | null) => void) : undefined;
  const children = childList(element, null);
  const childContext = (c: DomContext): DomContext => (c.svg === svg ? c : { ...c, svg });
  if (!VOID.has(first.tag)) children.update(first.children ?? [], childContext(context));
  parent.insertBefore(element, before);
  let mounted: Mounted | null = null;
  let gone = false;
  later(() => {
    if (gone) return;
    mounted = mountNode(element, node, { handlers: ctx.handlers, stores: ctx.stores });
    ref?.(element);
  });
  return {
    update(child, next, root) {
      if (typeof child !== 'object' || !isNode(child) || child.tag !== first.tag) return false;
      node = child;
      ctx = next;
      const nextAttrs = attrsOf(child, root);
      patchAttrs(element, attrs, nextAttrs);
      attrs = nextAttrs;
      rootListeners = listenersOf(root);
      listenRoot();
      const nextRef = typeof root?.ref === 'function' ? (root.ref as (element: Element | null) => void) : undefined;
      if (nextRef !== ref) {
        ref?.(null);
        ref = nextRef;
        later(() => ref?.(element));
      }
      if (!VOID.has(child.tag)) children.update(child.children ?? [], childContext(next));
      later(() => {
        if (!gone) mounted?.update(node, { handlers: ctx.handlers, stores: ctx.stores });
      });
      return true;
    },
    nodes: () => [element],
    destroy() {
      gone = true;
      children.destroy();
      mounted?.destroy();
      mounted = null;
      for (const [type, listener] of listened) element.removeEventListener(type, listener);
      listened.clear();
      ref?.(null);
      element.remove();
    },
  };
}
