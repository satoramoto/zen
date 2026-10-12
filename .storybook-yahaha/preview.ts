import type { Preview } from '@storybook/react-vite';
import { libraryGlobalTypes, libraryInitialGlobals } from '../src/library/storybook';
const preview: Preview = {
  globalTypes: libraryGlobalTypes,
  initialGlobals: libraryInitialGlobals,
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'todo' },
    options: { storySort: { order: ['Library', ['Yahaha', ['Screens', 'Components', 'Primitives']]] } },
  },
};
export default preview;
