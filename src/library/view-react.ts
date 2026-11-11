// The view tree's React entry: `@satoramoto/zen/view/react`. React's `Tree` draws a model's tree;
// `registerComponents` adds an app's own parts, so a tree that names one draws it.

/** Draws a view tree with React. */
export { Tree, type TreeProps } from './foundation/view/Tree';
/** Adds an app's React parts by name; a name zen already has is refused. */
export { registerComponents, reactComponent } from './foundation/view/reactComponents';
/** Adds an app's stores by name, for both renderers. */
export { registerStores } from './foundation/view/stores';
