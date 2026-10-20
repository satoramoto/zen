// The view tree, the framework-free half of `Tree.tsx` and `Tree.svelte`: what a component draws,
// as plain data. A model returns one (`buttonView(props)`), and the two renderers, `Tree.tsx`
// (React) and `Tree.svelte` (Svelte), draw it the same way: they
// create the elements, fill the slots, attach the `on` handlers by key and apply the `bind` stores
// by name. No framework here, and no functions in a tree: callbacks reach it through `handlers`,
// stateful behaviour through the stores in `stores.ts`, so a tree snapshots as text.

/** A hole the renderer fills: a React node or a Svelte snippet, passed to `Tree` as `slots[name]`. */
export interface Slot {
  slot: string;
}

/** A child: an element, a component, text, or a slot. */
export type Child = Node | ComponentNode | string | Slot;

/**
 * A registered component (`reactComponents.ts`, `svelteComponents.ts`), by name: how a composite's
 * model draws another component without importing a renderer. `props` are plain data; `on` maps a
 * callback prop to a handler key (`{ onToggle: 'toggle' }` passes `handlers.toggle`); `slots` fill
 * the component's slots with subtrees (drawn in this tree, with its handlers and slots), or pass one
 * of this tree's own slots through (`{ children: slot('children') }`).
 */
export interface ComponentNode {
  component: string;
  props?: Record<string, unknown>;
  on?: Record<string, string>;
  slots?: Record<string, (Child | null)[] | Slot>;
  key?: string;
}

/** A store applied to the element: its registered name (`stores.ts`) and its params (plain data;
 *  a param naming a callback holds the handler's key). */
export type Bind = [store: string, params: object];

/** One element. */
export interface Node {
  /** The element's tag (`button`, `span`, `svg`, `path`, …). Inside an `svg`, the SVG namespace. */
  tag: string;
  /** Attributes by their DOM name (`class`, `aria-pressed`, `viewBox`): strings, or undefined for
   *  none. Never booleans: a present boolean attribute is `''`. */
  attrs?: Record<string, string | undefined>;
  /** In order; `null` is a hole (a `when` that didn't hold), kept so the siblings after it keep
   *  their positions, and so their elements, when it fills. */
  children?: (Child | null)[];
  /** A stable identity among its siblings, for lists that reorder (`each`). */
  key?: string;
  /** DOM events to handler keys: `{ click: 'press' }` calls `handlers.press(event)`. */
  on?: Record<string, string>;
  /** Stores applied to the element while it is mounted, in order. */
  bind?: Bind[];
}

/** A callback a tree refers to by key. */
export type Handler = (...args: any[]) => unknown;
/** The callbacks a tree refers to, by key (`on` values and store params). */
export type Handlers = Record<string, Handler | undefined>;

/** A child or a list of them; null, undefined and false draw nothing (for `when`). */
type ChildArg = Child | null | undefined | false | ChildArg[];

const flatten = (children: ChildArg[]): (Child | null)[] =>
  children.flatMap((child): (Child | null)[] => (Array.isArray(child) ? flatten(child) : child === null || child === undefined || child === false ? [null] : [child]));

/**
 * An element: `h('span', { class: 'x' }, 'text', h('b', {}, '!'))`. A list (`each`) flattens into
 * the children; null, undefined and false leave a hole. Unkeyed children are matched by position,
 * so give a list of varying length its own parent (or keys) rather than unkeyed siblings after it.
 */
export function h(tag: string, attrs: Record<string, string | undefined> = {}, ...children: ChildArg[]): Node {
  const node: Node = { tag, attrs };
  const flat = flatten(children);
  if (flat.some((child) => child !== null)) node.children = flat;
  return node;
}

/** A slot child: `slot('icon')`. */
export const slot = (name: string): Slot => ({ slot: name });

/** A component child: `component('LampButton', { label: 'On' }, { on: { onToggle: 'toggle' } })`. A
 *  slot's list flattens and keeps holes, as `h`'s children do. */
export function component(
  name: string,
  props: Record<string, unknown> = {},
  { on, slots, key }: { on?: Record<string, string>; slots?: Record<string, ChildArg[] | Slot>; key?: string } = {},
): ComponentNode {
  const node: ComponentNode = { component: name, props };
  if (on) node.on = on;
  if (slots) node.slots = Object.fromEntries(Object.entries(slots).map(([n, fill]) => [n, Array.isArray(fill) ? flatten(fill) : fill]));
  if (key !== undefined) node.key = key;
  return node;
}

/** `then()` when `test` holds, else nothing: `when(view.label !== null, () => h('span', …))`. */
export function when<T>(test: boolean, then: () => T): T | null {
  return test ? then() : null;
}

/** A keyed list: each item's node gets `key(item)`, so both renderers move it rather than redraw it. */
export function each<T>(items: readonly T[], key: (item: T, index: number) => string, draw: (item: T, index: number) => Node): Node[] {
  return items.map((item, index) => ({ ...draw(item, index), key: key(item, index) }));
}

/** Adds `on` handlers and `bind` stores to a node. */
export function wire(node: Node, wiring: { on?: Record<string, string>; bind?: Bind[] }): Node {
  return { ...node, ...(wiring.on ? { on: wiring.on } : {}), ...(wiring.bind ? { bind: wiring.bind } : {}) };
}

/** A style map as an inline `style` string (`--a: 1; min-width: 2px`), undefined values skipped;
 *  undefined when there is nothing to set. */
export function styleText(style: Record<string, string | undefined> | undefined): string | undefined {
  if (style === undefined) return undefined;
  const text = Object.entries(style)
    .filter(([, value]) => value !== undefined)
    .map(([property, value]) => `${property}: ${value}`)
    .join('; ');
  return text === '' ? undefined : text;
}

export const isSlot = (child: Child): child is Slot => typeof child === 'object' && 'slot' in child;
export const isNode = (child: Child): child is Node => typeof child === 'object' && 'tag' in child;
export const isComponent = (child: Child): child is ComponentNode => typeof child === 'object' && 'component' in child;
/** A component's slot fill: one of the tree's own slots passed through, or a list of children. */
export const isSlotFill = (fill: (Child | null)[] | Slot): fill is Slot => !Array.isArray(fill);

/** A child's identity among its siblings: its `key`, else its position (and, for a component, its
 *  name, so another component in the same place is a new one). */
export function childKey(child: Child | null, index: number): string {
  if (child !== null && (isNode(child) || isComponent(child)) && child.key !== undefined) return `k:${child.key}`;
  return child !== null && isComponent(child) ? `#${index}:${child.component}` : `#${index}`;
}

/** A component node's props as a renderer passes them: its data, then each `on` prop as a function
 *  calling the latest handler for its key. */
export function componentProps(node: ComponentNode, handler: (key: string) => Handler | undefined): Record<string, unknown> {
  const props: Record<string, unknown> = { ...node.props };
  for (const [prop, key] of Object.entries(node.on ?? {})) props[prop] = (...args: unknown[]) => handler(key)?.(...args);
  return props;
}

/** Form state both renderers set as element properties, not attributes (so it follows the tree, not
 *  the first render): `value` (a string), `checked` and `indeterminate` (`''` true, undefined false).
 *  Listed in `attrs` like any attribute; `mount.ts` sets them, on mount and whenever they change. */
export const PROPERTIES = new Set(['value', 'checked', 'indeterminate']);

export const SVG_NS = 'http://www.w3.org/2000/svg';

/** Attributes both renderers set as boolean properties: `''` (present) becomes `true`. */
const BOOLEAN = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
]);

/** A node's attributes as both renderers pass them on: undefined dropped, boolean attributes `true`,
 *  form properties (`PROPERTIES`) left to `mount.ts`. */
export function domAttrs(attrs: Record<string, string | undefined> | undefined): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (const [name, value] of Object.entries(attrs ?? {})) {
    if (value === undefined || PROPERTIES.has(name)) continue;
    out[name] = BOOLEAN.has(name.toLowerCase()) ? true : value;
  }
  return out;
}

/**
 * A tree as canonical text, for snapshots: one line per element (attributes sorted, `on` as
 * `@event=key`, `bind` as `use:store={params}`), text quoted, slots as `{slot}`. A component is
 * `<Name prop={json} @onX=key>`, each of its slots a `#name` line over its contents.
 */
export function printTree(child: Child, depth = 0): string {
  const pad = '  '.repeat(depth);
  if (typeof child === 'string') return `${pad}${JSON.stringify(child)}`;
  if (isSlot(child)) return `${pad}{${child.slot}}`;
  if (isComponent(child)) {
    const props = Object.entries(child.props ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
      .sort();
    const on = Object.entries(child.on ?? {}).map(([prop, key]) => `@${prop}=${key}`);
    const head = [child.component, ...(child.key !== undefined ? [`key=${child.key}`] : []), ...props, ...on].join(' ');
    const slots = Object.entries(child.slots ?? {}).flatMap(([name, fill]) => [
      `${pad}  #${name}`,
      ...(isSlotFill(fill) ? [printTree(fill, depth + 2)] : fill.flatMap((c) => (c === null ? [] : [printTree(c, depth + 2)]))),
    ]);
    return [`${pad}<${head}>`, ...slots].join('\n');
  }
  const attrs = Object.entries(child.attrs ?? {})
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}="${value}"`)
    .sort();
  const on = Object.entries(child.on ?? {}).map(([event, key]) => `@${event}=${key}`);
  const bind = (child.bind ?? []).map(([store, params]) => `use:${store}=${JSON.stringify(params)}`);
  const head = [child.tag, ...(child.key !== undefined ? [`key=${child.key}`] : []), ...attrs, ...on, ...bind].join(' ');
  const lines = [`${pad}<${head}>`, ...(child.children ?? []).flatMap((c) => (c === null ? [] : [printTree(c, depth + 1)]))];
  return lines.join('\n');
}
