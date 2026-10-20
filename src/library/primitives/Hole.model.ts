// Opaque's and Hole's elements, framework-free: `Opaque.svelte` and `Hole.svelte` render them, and
// they match React's `Opaque` and `Hole` (Surface.tsx), which draw the same class and attributes.
import { h, type Node } from '../view/Tree.model';
import type { ElementView, TreeChildren } from './Text.model';

/** Opaque's element: `lib-opaque` plus the caller's class. */
export const opaqueView = (className?: string): ElementView => ({ className: `lib-opaque${className ? ` ${className}` : ''}`, attrs: {} });

/** Hole's element: `lib-hole`, `data-part="hole"`, and an `img` role when it has a name. */
export const holeView = (className?: string, name?: string): ElementView => ({
  className: `lib-hole${className ? ` ${className}` : ''}`,
  attrs: { 'data-part': 'hole', 'aria-label': name, role: name ? 'img' : undefined },
});

/** Opaque as a view-tree element, for a model to inline: the `div` `<Opaque>` draws, its attributes
 *  (`attrs`) and children added. Only the element: the `Opaque` components (React and Svelte) also
 *  turn off the shaders of the `Surface` components inside (a context), which tree surfaces
 *  (`surfaceNode`) never draw. */
export function opaqueNode(className?: string, attrs: Record<string, string | undefined> = {}, ...children: TreeChildren): Node {
  const view = opaqueView(className);
  return h('div', { class: view.className, ...view.attrs, ...attrs }, ...children);
}

/** Hole as a view-tree element, for a model to inline: the `div` `<Hole name>` draws, its attributes
 *  (`attrs`, after Hole's own) and children added. */
export function holeNode(className?: string, name?: string, attrs: Record<string, string | undefined> = {}, ...children: TreeChildren): Node {
  const view = holeView(className, name);
  return h('div', { class: view.className, ...view.attrs, ...attrs }, ...children);
}
