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
