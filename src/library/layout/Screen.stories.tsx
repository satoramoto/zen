import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { treeStory, withRenderer, type StoryView } from '../stories/story';
import { screenArgTypes, screenArgs, screenSample, screenStoryArgs, type ScreenArgs } from './Screen.fixtures';

const view: StoryView<ScreenArgs> = (args) => ({ tree: screenSample(args) });

/**
 * Each story is a view tree (`screenSample`, Screen.fixtures.ts): a Screen with Regions in its
 * header, footer and grid, drawn by React's or Svelte's `Tree` (the toolbar's Renderer).
 */
const meta: Meta<ScreenArgs> = {
  title: 'Design OS/Layout/Screen',
  decorators: [withRenderer, withLibraryTheme],
  render: treeStory(view).render,
  parameters: { layout: 'fullscreen', ...treeStory(view).parameters },
  args: screenArgs,
  argTypes: screenArgTypes,
};
export default meta;
type Story = StoryObj<ScreenArgs>;

/** A fixed header, a named grid of regions spaced by the plate gap, and a fixed footer. Change the arrangement: the regions move, the frame stays. */
export const Default: Story = { args: screenStoryArgs.Default };

/** The grid alone, no header or footer. */
export const GridOnly: Story = { args: screenStoryArgs.GridOnly };
