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
    viewport: {
      options: {
        desktop1440: { name: 'Desktop 1440 × 900', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
        desktop1217: { name: 'Desktop 1217 × 752', styles: { width: '1217px', height: '752px' }, type: 'desktop' },
        window900: { name: 'Window 900 × 700', styles: { width: '900px', height: '700px' }, type: 'desktop' },
        narrow560: { name: 'Narrow 560 × 800', styles: { width: '560px', height: '800px' }, type: 'desktop' },
      },
    },
    options: {
      storySort: {
        order: [
          'Design OS',
          ['Systems', 'Layout', 'Components', ['Core', 'Music']],
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
