import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../foundation/stories/story';
import { RearPanel } from './RearPanel';
import RearPanelSvelte from './RearPanel.svelte';
import { rearPanelStories as s } from './RearPanel.fixtures';

const meta = {
  title: 'Push/Layouts/RearPanel',
  component: RearPanel,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'padded' },
  args: { onInput: fn() },
} satisfies Meta<typeof RearPanel>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(RearPanel, RearPanelSvelte);

/** The unit's back with the sample Set's connections. */
export const Sample: Story = story(s.Sample);
/** Nothing plugged in. */
export const Empty: Story = story(s.Empty);
