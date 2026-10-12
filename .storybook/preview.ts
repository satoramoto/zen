import type { Preview } from '@storybook/react-vite';
import '../src/styles.css';
import { libraryGlobalTypes, libraryInitialGlobals } from '../src/library/storybook';
const preview: Preview = {
  globalTypes: libraryGlobalTypes,
  initialGlobals: libraryInitialGlobals,
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'todo' },
    options: {
      storySort: {
        order: [
          'Design OS',
          ['Components', ['Core', 'Music']],
          'Yahaha',
          ['Screens', 'Components', 'Primitives'],
          'open[flow]',
          'Overview',
          'Thinking with Type',
          'Grid Systems',
          'Interaction of Color',
          'Refactoring UI',
          'On Web Typography',
          'Practical Typography',
        ],
      },
    },
  },
};
export default preview;
