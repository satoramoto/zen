// The theme scope's model, framework-free: the operating system's light/dark preference as a
// store, mode resolution, and the scope element's class, attributes and custom properties.
// `ThemeScope` (theme.tsx, React) and the Svelte `theme` action and `ThemeScope.svelte`
// (svelte/theme.svelte.ts) all draw `scopeView`.
import { toCssVars, type Facets, type Mode } from './contract';

/** `system` follows the operating system's light/dark preference. */
export type ModeChoice = Mode | 'system';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const media = () => (typeof window === 'undefined' || !window.matchMedia ? null : window.matchMedia(DARK_QUERY));

/** Calls `onChange` whenever the system's light/dark preference changes; returns the unsubscribe. */
export function subscribeSystemMode(onChange: () => void): () => void {
  const list = media();
  list?.addEventListener('change', onChange);
  return () => list?.removeEventListener('change', onChange);
}

/** The system's light/dark preference now (`light` where there is no `matchMedia`). */
export const getSystemMode = (): Mode => (media()?.matches ? 'dark' : 'light');

/** The mode a choice draws in: `system` takes the system's. */
export const resolveMode = (choice: ModeChoice, system: Mode): Mode => (choice === 'system' ? system : choice);

/** The scope element: `lib-scope`, its mode and bleed, and the contract's custom properties. */
export interface ScopeView {
  className: 'lib-scope';
  attrs: { 'data-mode': Mode; 'data-bleed': string | undefined };
  vars: Record<string, string>;
}

/** `bleed`: the scope is a whole screen (an app's window), so it runs to the edges with no padding. */
export function scopeView(facets: Facets, mode: Mode, bleed = false): ScopeView {
  return {
    className: 'lib-scope',
    attrs: { 'data-mode': mode, 'data-bleed': bleed ? 'true' : undefined },
    vars: toCssVars(facets, mode),
  };
}

/** Custom properties as a `style` attribute's text (`--a: 1; --b: 2`): the view tree's `styleText`. */
export { styleText } from './view/Tree.model';
