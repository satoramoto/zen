import type { Preview } from '@storybook/react-vite';
import '../src/styles.css';
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
          'Design OS',
          ['Systems', 'Layout', 'Components', ['Core', 'Music'], 'Graph', ['Circuit', ['Samples', 'Behaviours'], 'Graph', 'Device', 'NodeSheet']],
          'Music',
          [
            'Mixer', ['Four-deck mixer', 'Deck strip', 'Master strip', 'Transport', 'Wave controls'],
            'Controls', ['Knob', 'Fader', 'Number field', 'Button', 'Toggle', 'Hold button', 'Segmented', 'Select'],
            'Displays', ['Meter', 'Waveform'],
            'Overlays', ['Context panel', 'Popup'],
            'Themes', ['Theme editor'],
            'Foundations', ['Button face', 'Label', 'Frame bindings'],
          ],
          'Harness',
          ['Claude Code', ['Kit', 'Skins', 'Sample mod']],
          'Yahaha',
          ['Screens', 'Components', 'Primitives'],
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
