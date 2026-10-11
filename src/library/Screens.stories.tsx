import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrangerStage } from './screens/ArrangerStage';
import { ThemeInspector } from './screens/ThemeInspector';
import { resolveTheme } from './theme';
import { withLibraryTheme } from './storybook';

const meta: Meta = {
  title: 'Library/Screens',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Stage: Story = { render: () => <ArrangerStage /> };

export const ThemeInspectorStory: Story = {
  name: 'Theme inspector',
  render: (_args, { globals }) => {
    const { pack, facets } = resolveTheme(globals);
    return <ThemeInspector pack={pack} facets={facets} />;
  },
};
