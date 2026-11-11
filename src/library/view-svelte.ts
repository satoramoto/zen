// The view tree's Svelte entry: `@satoramoto/zen/view/svelte`. Svelte's `Tree` draws the same tree
// to the same DOM as React's; `registerComponents` adds an app's own Svelte parts by name.
import type { Component } from 'svelte';
import TreeBinding from './foundation/view/Tree.svelte';
import type { Handlers, Root } from './foundation/view/Tree.model';
import type { Stores } from './foundation/view/stores';

/** What Svelte's `Tree` takes: the tree, its slots' snippets, the handlers by key, and optionally
 *  the store and component registries in place of the shared ones. */
export interface TreeProps {
  tree: Root;
  slots?: Record<string, unknown>;
  handlers?: Handlers;
  stores?: Stores;
  components?: (name: string) => Component<any>;
  svg?: boolean;
}

/** Draws a view tree with Svelte 5. */
export const Tree = TreeBinding as unknown as Component<TreeProps>;
/** Adds an app's Svelte parts by name; a name zen already has is refused. */
export { registerComponents, svelteComponent } from './foundation/view/svelteComponents';
/** Adds an app's stores by name, for both renderers. */
export { registerStores } from './foundation/view/stores';
