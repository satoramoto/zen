// The part of Claude Code's plugin API (the `claude-code` module and its JSX globals) that the
// harness's own files are typed against in zen: the kit, the sample mod and the stories.
//
// The engine writes its full declarations beside a mod it loads
// (`.claude-plugin/types/claude-code/index.d.ts`); a mod built with zen is type-checked against
// those (`bunx tsc -p plugins/<mod>`). This stand-in only names the shapes the harness reads, as
// loosely as the engine allows, so zen type-checks without an engine installed. It is a script
// (no imports or exports), so everything here is global, and it is never copied into a plugin.

declare module 'claude-code' {
  /** Where a render hook draws. */
  export type RenderSurface = 'terminal' | 'desktop' | 'mobile' | 'vscode';
  /** A plain-data element: a tag from the surface's element table, its props, its children. */
  export type RenderElement = { type: string; props: Record<string, any>; children?: unknown };
  /** Everything a render hook may draw: an element or a string. */
  export type RenderNode = RenderElement | string;
  /** What an element takes as `children`, as JSX passes them. */
  export type RenderChildren = RenderNode | number | boolean | null | undefined | readonly RenderChildren[];

  // What the sample mod uses beyond drawing (in Storybook, `claude-code` is the bench's stand-in, bench/engine.ts).

  /** A piece of the plugin's state: its plugin and key, and what it holds before anything is written. */
  export type Atom<T> = { plugin: string; key: string; initial: T };
  /** Names a piece of the plugin's state. */
  export function atom<T>(ref: { plugin: string; key: string }, initial: T): Atom<T>;
  /** What the atom holds now. */
  export function read<T>($: unknown, a: Atom<T>): Promise<T>;
  /** Writes the atom from what it held; panes that read it draw again. */
  export function update<T>($: unknown, a: Atom<T>, fn: (old: T) => T): Promise<void>;

  /** The engine as a hook sees it (`$`), loosely: `ui.resolve(e)` hands back the surface's element constructors. */
  export type EngineInterface = {
    ui: { resolve(e: unknown): Record<string, (props?: any, ...children: any[]) => RenderElement>; [verb: string]: any };
    [noun: string]: any;
  };
  /** A `ui.render` hook's event for a Pane. */
  export type RenderEvent = {
    component: string;
    requestId: string;
    surface: RenderSurface;
    props: { title: string; isFocused: boolean; bodyColumns: number; [prop: string]: any };
  };
  /** A hook: the engine, the event, and the rest of the chain. */
  export type Hook<E = any> = ($: EngineInterface, e: E, next: (e: E) => Promise<unknown>) => unknown;
  /** What `on` hands back. */
  export type HookHandle = { catch(fn: (err: unknown) => void): HookHandle };
  /** Adds a hook for an event, with or without a matcher. */
  export type On = {
    (event: 'ui.render', matcher: { component: string; requestId?: string }, hook: Hook<RenderEvent>): HookHandle;
    (event: string, matcher: Record<string, unknown>, hook: Hook): HookHandle;
    (event: string, hook: Hook): HookHandle;
  };
  /** A hooks module's `register`. */
  export type Register = (on: On, options?: unknown) => void;
}

/** What JSX compiles against in a hooks module (the engine's global). */
declare const h: (
  tag: string | ((props: never) => import('claude-code').RenderNode | null | undefined),
  props: Record<string, unknown> | null | undefined,
  ...children: unknown[]
) => import('claude-code').RenderNode | null | undefined;

/** `<>...</>`: a column Box around the children. */
declare const Fragment: (props: { children?: import('claude-code').RenderNode[] }) => import('claude-code').RenderElement;

/** JSX over the element table: every tag is a constructor; there are no intrinsic tags. */
declare namespace JSX {
  type Element = import('claude-code').RenderElement;
  type ElementType = (props: never) => import('claude-code').RenderNode | null | undefined;
  interface IntrinsicElements {}
  interface ElementChildrenAttribute {
    children: unknown;
  }
  interface IntrinsicAttributes {
    key?: string;
  }
}
