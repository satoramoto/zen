// The React renderer of a view tree (`tree.ts`): every converted component's `.tsx` is one
// `<Tree tree={xView(props)} slots={…} handlers={…} />`. `Tree.svelte` draws the same DOM.
import { createElement, Fragment, useLayoutEffect, useRef, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { childKey, componentProps, domAttrs, isComponent, isSlot, isSlotFill, type Child, type ComponentNode, type Handlers, type Node } from './Tree.model';
import { mountNode, type MountContext, type Mounted } from './mount';
import { stores as registry, type Stores } from './stores';
import { reactComponent } from './reactComponents';

export interface TreeProps {
  /** The view a model returned. */
  tree: Node;
  /** What fills each `slot(name)`: React nodes. An unfilled slot draws nothing. */
  slots?: Record<string, ReactNode>;
  /** The callbacks `on` and the store params name, by key. */
  handlers?: Handlers;
  /** The store registry (default: every registered store, `stores.ts`). */
  stores?: Stores;
  /** The component registry (default: `reactComponents.ts`). */
  components?: (name: string) => ComponentType<any>;
}

interface Context extends MountContext {
  slots: Record<string, ReactNode>;
  components: (name: string) => ComponentType<any>;
}

export function Tree({ tree, slots = {}, handlers = {}, stores = registry, components = reactComponent }: TreeProps) {
  return draw(tree, { slots, handlers, stores, components }, '#0');
}

function draw(child: Child, context: Context, key: string): ReactNode {
  if (typeof child === 'string') return child;
  if (isSlot(child)) return createElement(Fragment, { key }, context.slots[child.slot]);
  if (isComponent(child)) return drawComponent(child, context, key);
  return createElement(Element, { key, node: child, context });
}

const drawAll = (children: (Child | null)[], context: Context): ReactNode[] =>
  children.map((child, i) => (child === null ? null : draw(child, context, childKey(child, i))));

/** A registered component with its props, its `on` callbacks calling this tree's handlers, and its
 *  slots as React nodes drawn in this tree (a slot named `children` is its children). */
function drawComponent(node: ComponentNode, context: Context, key: string): ReactNode {
  const props = componentProps(node, (handlerKey) => context.handlers[handlerKey]);
  for (const [name, fill] of Object.entries(node.slots ?? {})) {
    props[name] = isSlotFill(fill) ? context.slots[fill.slot] : createElement(Fragment, null, ...drawAll(fill, context));
  }
  return createElement(context.components(node.component), { ...props, key });
}

/** React names for DOM attributes it spells otherwise. */
const RENAMED: Record<string, string> = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', autofocus: 'autoFocus' };

const camel = (name: string) => name.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase());

/** A `style` string as React's style object (`min-width` → `minWidth`; custom properties as is). */
function styleObject(text: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const declaration of text.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const name = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!name) continue;
    // `--x` as is; `-webkit-x` → `WebkitX`, `-ms-x` → `msX`, `min-width` → `minWidth`.
    style[name.startsWith('--') ? name : camel(name.startsWith('-ms-') ? name.slice(1) : name)] = value;
  }
  return style as CSSProperties;
}

/** A node's attributes as React props: `class` → `className`, `style` → an object, other
 *  hyphenated names (SVG's `stroke-width`) camel-cased; `data-*` and `aria-*` as is. */
function reactProps(node: Node): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(domAttrs(node.attrs))) {
    if (name === 'style') props.style = styleObject(value as string);
    else if (RENAMED[name]) props[RENAMED[name]] = value;
    else if (name.startsWith('data-') || name.startsWith('aria-')) props[name] = value;
    else props[name.includes('-') || name.includes(':') ? camel(name) : name] = value;
  }
  return props;
}

function Element({ node, context }: { node: Node; context: Context }) {
  const ref = useRef<globalThis.Element>(null);
  const mounted = useRef<Mounted | null>(null);
  const latest = useRef({ node, context });
  latest.current = { node, context };

  // Mount the handlers and stores on the element (again if the tag, so the element, changes)...
  useLayoutEffect(() => {
    if (!ref.current) return;
    mounted.current = mountNode(ref.current, latest.current.node, latest.current.context);
    return () => {
      mounted.current?.destroy();
      mounted.current = null;
    };
  }, [node.tag]);
  // ...and give them every render's node and handlers.
  useLayoutEffect(() => {
    mounted.current?.update(node, context);
  });

  return createElement(node.tag, { ...reactProps(node), ref }, ...drawAll(node.children ?? [], context));
}
