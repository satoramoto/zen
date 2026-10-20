import type { Preview } from '@storybook/svelte-vite';
import '../src/styles.css';
import { libraryGlobalTypes, libraryInitialGlobals } from '../src/library/storybook-svelte';

// The same toolbar as the React Storybook (theme pack, mode, facets); each story file applies
// `withLibraryTheme` itself, as the React stories do.
const preview: Preview = {
  globalTypes: libraryGlobalTypes,
  initialGlobals: libraryInitialGlobals,
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'todo' },
    options: { storySort: { order: ['Design OS', ['Primitives', 'Components', ['Core', 'Music']]] } },
  },
};
export default preview;
