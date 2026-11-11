import type { Preview } from '@storybook/react-vite';

// The decorator proves the project's preview is applied on the virtual DOM too.
const preview: Preview = {
  decorators: [(Story) => { document.body.dataset.fixturePreview = 'applied'; return Story(); }],
};
export default preview;
