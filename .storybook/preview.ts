import type { Preview } from '@storybook/react-vite';
import './preview.css';
import { libraryGlobalTypes, libraryInitialGlobals } from '../src/library/storybook';
import { rendererGlobalTypes, rendererInitialGlobals } from '../src/library/storybook.globals';
// The Claude Code harness: the global `h`/`Fragment` its kit and sample mod compile against, its
// toolbar (surface, pane theme, frame, width, skin) and the decorator that draws `Harness/...` stories in a pane.
import '../src/harness/claude-code/bench/globals';
import { harnessGlobalTypes, harnessInitialGlobals, withHarness } from '../src/harness/claude-code/storybook';
const preview: Preview = {
  globalTypes: { ...libraryGlobalTypes, ...rendererGlobalTypes, ...harnessGlobalTypes },
  initialGlobals: { ...libraryInitialGlobals, ...rendererInitialGlobals, ...harnessInitialGlobals },
  decorators: [withHarness],
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
          'Core', ['Primitives', 'Components', 'Layouts', 'Screens'],
          'Music', ['Screens', 'Layouts', 'Components', 'Live', ['Screens', 'Layouts', 'Components']],
          'Graph', ['Screens', 'Layouts', 'Components'],
          'Shader',
          'Report', ['Screens', 'Layouts', 'Components'],
          'Math', ['Screens', 'Layouts', 'Components'],
          'Compendium', ['Screens', 'Layouts', 'Components', 'Book'],
          'Openspec', ['Screens', 'Layouts', 'Components'],
          'Site', ['Screens', 'Layouts', 'Components'],
          'Harness',
          ['Claude Code', ['Kit', 'Skins', 'Sample mod']],
          'Yahaha', ['Screens', 'Layouts', 'Components'],
        ],
      },
    },
  },
};
export default preview;
