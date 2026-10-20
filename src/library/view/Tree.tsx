// The React renderer of a view tree (`Tree.model.ts`): every converted component's `.tsx` is one
// `<Tree tree={xView(props)} slots={…} handlers={…} />`. `Tree.svelte` draws the same DOM.
import { createElement, Fragment, useLayoutEffect, useRef, type ComponentType, type CSSProperties, type ReactNode, type Ref } from 'react';
import { VOID, childKey, componentProps, domAttrs, isComponent, isSlot, isSlotFill, type Child, type ComponentNode, type Handlers, type Node, type Root } from './Tree.model';
import { mountNode, type MountContext, type Mounted } from './mount';
import { styleObject as styleRecord } from './style';
import { stores as registry, type Stores } from './stores';
import { reactComponent } from './reactComponents';

/** What fills a slot: a React node, or a function of the slot's `args` (`slot(name, args)`). */
export type SlotFill = ReactNode | ((...args: any[]) => ReactNode);

export interface TreeProps {
  /** The view a model returned: an element, a component, text, a slot, or a fragment (a list of them). */
  tree: Root;
  /** What fills each `slot(name)`: React nodes, or functions of the slot's arguments. An unfilled slot draws nothing. */
  slots?: Record<string, SlotFill>;
  /** The callbacks `on` and the store params name, by key. */
  handlers?: Handlers;
  /** The store registry (default: every registered store, `stores.ts`). */
  stores?: Stores;
  /** The component registry (default: `reactComponents.ts`). */
  components?: (name: string) => ComponentType<any>;
  /** The root element (or, for a component root, handed to it as its `ref`). */
  ref?: Ref<any>;
  /** Any other prop lands on the root, after the tree's own attributes: native attributes and
   *  React listeners on an element root (a `style` string becomes an object), props on a component
   *  root. A fragment, text or slot root takes none. */
  [native: string]: unknown;
}

interface Context extends MountContext {
  slots: Record<string, SlotFill>;
  components: (name: string) => ComponentType<any>;
}

/** What the root takes from `Tree`'s own props: its ref and the rest. */
interface Extra {
  ref?: Ref<any>;
  props: Record<string, unknown>;
}

export function Tree({ tree, slots = {}, handlers = {}, stores = registry, components = reactComponent, ref, ...native }: TreeProps) {
  const context: Context = { slots, handlers, stores, components };
  if (Array.isArray(tree)) return createElement(Fragment, null, ...drawAll(tree, context));
  return draw(tree, context, '#0', { ref, props: native });
}

function draw(child: Child, context: Context, key: string, extra?: Extra): ReactNode {
  if (typeof child === 'string') return child;
  if (isSlot(child)) return createElement(Fragment, { key }, fillSlot(context.slots[child.slot], child.args));
  if (isComponent(child)) return drawComponent(child, context, key, extra);
  return createElement(Element, { key, node: child, context, extra });
}

/** A slot's fill: a function is called with the slot's arguments, anything else drawn as is. */
const fillSlot = (fill: SlotFill, args: unknown[] = []): ReactNode => (typeof fill === 'function' ? fill(...args) : fill);

const drawAll = (children: (Child | null)[], context: Context): ReactNode[] =>
  children.map((child, i) => (child === null ? null : draw(child, context, childKey(child, i))));

/** A registered component with its props, its `on` callbacks (this tree's handlers), and its
 *  slots as React nodes drawn in this tree (a slot named `children` is its children) or this
 *  tree's own fills passed through as they are. At the root, `Tree`'s ref and other props too. */
function drawComponent(node: ComponentNode, context: Context, key: string, extra?: Extra): ReactNode {
  const props = componentProps(node, (handlerKey) => context.handlers[handlerKey]);
  for (const [name, fill] of Object.entries(node.slots ?? {})) {
    props[name] = isSlotFill(fill) ? context.slots[fill.slot] : createElement(Fragment, null, ...drawAll(fill, context));
  }
  return createElement(context.components(node.component), { ...props, ...extra?.props, ...(extra?.ref ? { ref: extra.ref } : {}), key });
}

/** React names for DOM attributes it spells otherwise (a hyphenated or namespaced name is
 *  camel-cased on its own: `accept-charset` → `acceptCharset`, `stroke-width` → `strokeWidth`). */
const RENAMED: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  autofocus: 'autoFocus',
  autocomplete: 'autoComplete',
  autocapitalize: 'autoCapitalize',
  autoplay: 'autoPlay',
  allowfullscreen: 'allowFullScreen',
  accesskey: 'accessKey',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  enctype: 'encType',
  enterkeyhint: 'enterKeyHint',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  frameborder: 'frameBorder',
  hreflang: 'hrefLang',
  inputmode: 'inputMode',
  maxlength: 'maxLength',
  minlength: 'minLength',
  novalidate: 'noValidate',
  playsinline: 'playsInline',
  referrerpolicy: 'referrerPolicy',
  spellcheck: 'spellCheck',
  srcdoc: 'srcDoc',
  srclang: 'srcLang',
  srcset: 'srcSet',
  usemap: 'useMap',
};

const camel = (name: string) => name.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase());

/** A `style` string as React's style object (`view/style.ts`, which keeps a `;` inside a value). */
const styleObject = (text: string): CSSProperties => styleRecord(text) as CSSProperties;

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

/** Sets a React ref (a callback or an object) to `value`. */
function setRef(ref: Ref<any> | undefined, value: globalThis.Element | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: unknown }).current = value;
}

function Element({ node, context, extra }: { node: Node; context: Context; extra?: Extra }) {
  const ref = useRef<globalThis.Element | null>(null);
  const mounted = useRef<Mounted | null>(null);
  const latest = useRef({ node, context });
  latest.current = { node, context };
  // The element goes to `Tree`'s ref as well (the root only): set again for a new ref or element,
  // null when it goes.
  const outer = extra?.ref;
  useLayoutEffect(() => {
    if (!outer) return;
    setRef(outer, ref.current);
    return () => setRef(outer, null);
  }, [outer, node.tag]);

  // Mount the handlers and stores on the element (again if the tag, so the element, changes)...
  useLayoutEffect(() => {
    if (!ref.current) return;
    mounted.current = mountNode(ref.current, latest.current.node, latest.current.context);
    return () => {
      mounted.current?.destroy();
      mounted.current = null;
    };
  }, [node.tag]);
  // ...and give them every render's node and handlers (each store updates only when its params or handlers changed).
  useLayoutEffect(() => {
    mounted.current?.update(node, context);
  });

  const native = extra?.props ?? {};
  const style = typeof native.style === 'string' ? { style: styleObject(native.style) } : {};
  const children = VOID.has(node.tag) ? [] : drawAll(node.children ?? [], context);
  return createElement(node.tag, { ...reactProps(node), ...native, ...style, ref }, ...children);
}
