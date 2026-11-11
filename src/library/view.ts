// The view tree's framework-free entry: `@satoramoto/zen/view`. What a model needs to describe a
// part as a tree that both renderers draw (docs/svelte-bindings.md), and the store contract an app's
// stateful behaviour follows. It imports neither React nor Svelte; `view-react.ts` and
// `view-svelte.ts` are the renderers.

/** Build a tree: an element (`h`), another part by its registered name (`component`), a slot, the
 *  handlers and stores an element takes (`wire`), and inline style as text (`styleText`). */
export { h, component, slot, when, each, wire, styleText, flag, printTree, type Node, type ComponentNode, type Child, type ChildArg, type Root, type Slot, type Bind, type Handler, type Handlers } from './foundation/view/Tree.model';
/** zen's Text and Icon primitives as tree nodes, for a model that draws text or an icon inline. */
export { textNode } from './primitives/Text/Text.model';
export { iconNode } from './primitives/Icon/Icon.model';
/** A component's local view state (a measured width, a fit step) that a store writes and a binding reads. */
export { viewState, type ViewState } from './foundation/view/viewState';
/** The store contract: `keyed` adapts a plain `bindX(node, params)` store to a tree, and
 *  `registerStores` adds an app's stores to the registry both renderers read. */
export { keyed, registerStores, type Store, type Stores, type StoreBinding, type Keyed } from './foundation/view/stores';
