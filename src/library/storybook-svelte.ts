// The Svelte Storybook entry of @satoramoto/zen: `@satoramoto/zen/storybook-svelte`, the same
// toolbar globals as `@satoramoto/zen/storybook` and a Svelte decorator that draws each story in a
// theme scope of the toolbar's choice. zen's `.storybook-svelte/preview.ts` uses it.
//
//   import { libraryGlobalTypes, libraryInitialGlobals, withLibraryTheme } from '@satoramoto/zen/storybook-svelte';
//   export default { globalTypes: libraryGlobalTypes, initialGlobals: libraryInitialGlobals, decorators: [withLibraryTheme] };
import type { Decorator } from '@storybook/svelte-vite';
import LibraryTheme from './svelte/LibraryTheme.svelte';

export { libraryGlobalTypes, libraryInitialGlobals } from './storybook.globals';

/** Draws the story in a `ThemeScope` of the toolbar's pack, mode and facets, on the pack's stand-in desktop. */
export const withLibraryTheme: Decorator = (_story, context) => ({
  Component: LibraryTheme,
  props: { globals: context.globals, bleed: context.parameters.layout === 'fullscreen' },
});
