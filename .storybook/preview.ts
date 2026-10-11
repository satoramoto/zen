import type { Preview } from '@storybook/react-vite';
import '../src/styles.css';
const preview: Preview = {
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    a11y: { test: 'todo' },
    options: { storySort: { order: ['Overview', 'Thinking with Type', 'Grid Systems', 'Interaction of Color', 'Refactoring UI', 'On Web Typography', 'Practical Typography'] } },
  },
};
export default preview;
