// A part as the DOM renderer draws it: `domPart(options, render)`, the third binding beside a
// part's `.tsx` and `.svelte`. `render(props, use)` does what those bindings do besides drawing,
// through `use` (view state, an id, the contexts, the theme scope), and returns the model's tree
// with its handlers, slots and root props; `Tree.dom.ts` draws it. Nothing else: the bindings-only
// rule holds a `.dom.ts` to `domPart`, `use`, its model and handlers, as it holds a `.tsx` to `<Tree>`.
import type { Handlers, Root } from './Tree.model';
import { viewState, type ViewState } from './viewState';
import { mountTree, type DomEnv, type DomFill, type DomPart, type DomPartInstance, type DomScope, type MountedTree, type RootProps } from './Tree.dom';
import { provideContext, readContext } from './contexts';

/** What a binding has besides its props. Call each in the same order on every draw, as hooks are. */
export interface DomUse {
  /** View state kept across draws; setting it draws the part again. */
  state<T>(initial: T | (() => T)): ViewState<T>;
  /** An id for this mounted part, the same on every draw (`«z1»`, as React's are `«r0»`). */
  id(): string;
  /** A context's value where the part sits (`control`, `opaque`, `form`, `surface`). */
  context<T = unknown>(name: string): T;
  /** Sets a context for everything the part's tree draws. */
  provide(name: string, value: unknown): void;
  /** The theme scope the part sits in (`zen-theme`), or null outside one. */
  scope(): DomScope | null;
}

/** What `render` returns: the tree and what it draws with. */
export interface DomDraw {
  tree: Root;
  handlers?: Handlers;
  slots?: Record<string, DomFill | undefined>;
  /** Lands on the root: native attributes, `on*` listeners and a `ref` (Svelte's `{...rest}`). */
  root?: RootProps;
}

/** What a host of a part (the Hotwire controller) needs to know of it. */
export interface DomPartOptions {
  /** The callback props the part calls, which a host turns into events (`onChange` → `zen:change`). */
  events?: readonly string[];
  /** The prop that holds the part's value and the callback that reports a new one: a host keeps
   *  its copy of the props in step, so a choice holds with no round trip. */
  value?: { prop: string; on: string };
}

/** A part the DOM renderer draws, with what a host needs to know of it. */
export interface DomPartDefinition extends DomPart {
  options: DomPartOptions;
}

let ids = 0;

/** A DOM binding: `render` is called on mount, on every update and whenever its state changes. */
export function domPart<P = Record<string, unknown>>(options: DomPartOptions, render: (props: P, use: DomUse) => DomDraw): DomPartDefinition {
  return {
    options,
    mount(parent, before, firstProps, firstEnv): DomPartInstance {
      let props = firstProps;
      let env = firstEnv;
      const states: ViewState<unknown>[] = [];
      const own: string[] = [];
      let cursor = { state: 0, id: 0 };
      let provided: Record<string, unknown> = {};
      let tree: MountedTree | null = null;
      let drawing = false;
      let again = false;
      let gone = false;
      const use: DomUse = {
        state<T>(initial: T | (() => T)) {
          const i = cursor.state++;
          if (!states[i]) {
            const state = viewState(typeof initial === 'function' ? (initial as () => T)() : initial);
            let subscribed = false;
            state.subscribe(() => {
              if (subscribed) redraw();
              subscribed = true;
            });
            states[i] = state as ViewState<unknown>;
          }
          return states[i] as ViewState<T>;
        },
        id() {
          const i = cursor.id++;
          return (own[i] ??= `«z${++ids}»`);
        },
        context: (name) => (name in provided ? (provided[name] as never) : readContext(env.contexts, name)),
        provide(name, value) {
          provided[name] = value;
        },
        scope: () => env.scope,
      };
      const drawOnce = () => {
        cursor = { state: 0, id: 0 };
        provided = {};
        const drawn = render(props as P, use);
        let contexts = env.contexts;
        for (const [name, value] of Object.entries(provided)) contexts = provideContext(contexts, name, value);
        const context = { ...env, contexts, slots: drawn.slots ?? {}, handlers: drawn.handlers ?? {} };
        if (tree) tree.update(drawn.tree, context, drawn.root);
        else tree = mountTree(parent, before, drawn.tree, context, drawn.root);
      };
      const redraw = () => {
        if (gone) return;
        if (drawing) {
          again = true;
          return;
        }
        drawing = true;
        try {
          do {
            again = false;
            drawOnce();
          } while (again && !gone);
        } finally {
          drawing = false;
        }
      };
      redraw();
      return {
        update(next, nextEnv) {
          props = next;
          env = nextEnv;
          redraw();
        },
        nodes: () => tree?.nodes() ?? [],
        destroy() {
          gone = true;
          tree?.destroy();
          tree = null;
        },
      };
    },
  };
}

/** A slot fill of plain text (a fixture's string `children`, as Svelte's `Render` draws it). */
export function textFill(text: string): DomFill {
  return (parent, before) => {
    const node = document.createTextNode(text);
    parent.insertBefore(node, before);
    return { update() {}, nodes: () => [node], destroy: () => node.remove() };
  };
}

/** A slot fill of DOM nodes, cloned from `source` (a `<template>`'s content, a fragment) each time
 *  it is drawn: server markup as a part's slot. */
export function cloneFill(source: () => globalThis.Node): DomFill {
  return (parent, before) => {
    let nodes: globalThis.Node[] = [];
    const put = (at: globalThis.Node | null, into: globalThis.Node) => {
      const copy = source().cloneNode(true);
      nodes = copy.nodeType === 11 ? Array.from(copy.childNodes) : [copy];
      into.insertBefore(copy, at);
    };
    put(before, parent);
    return {
      update() {},
      nodes: () => nodes,
      destroy() {
        for (const node of nodes) (node as ChildNode).remove();
        nodes = [];
      },
    };
  };
}

export type { DomEnv, DomFill, DomPart, DomScope } from './Tree.dom';
