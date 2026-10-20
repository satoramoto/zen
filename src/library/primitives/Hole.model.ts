// Opaque's and Hole's elements, framework-free: `Opaque.svelte` and `Hole.svelte` render them, and
// they match React's `Opaque` and `Hole` (Surface.tsx), which draw the same class and attributes.
import type { ElementView } from './Text.model';

/** Opaque's element: `lib-opaque` plus the caller's class. */
export const opaqueView = (className?: string): ElementView => ({ className: `lib-opaque${className ? ` ${className}` : ''}`, attrs: {} });

/** Hole's element: `lib-hole`, `data-part="hole"`, and an `img` role when it has a name. */
export const holeView = (className?: string, name?: string): ElementView => ({
  className: `lib-hole${className ? ` ${className}` : ''}`,
  attrs: { 'data-part': 'hole', 'aria-label': name, role: name ? 'img' : undefined },
});
