// Region in the Svelte Storybook: the untabbed stories of Region.stories.tsx, the same names and
// args, from Region.fixtures.ts, drawn by Region.story.svelte. WithViews and AsideSwitch wait for
// the Svelte `Tabs`.
import type { Meta } from '@storybook/svelte-vite';
import { withLibraryTheme } from '../storybook-svelte';
import RegionStory from './Region.story.svelte';
import { regionArgTypes, regionArgs, regionStoryArgs } from './Region.fixtures';

const meta: Meta = {
  title: 'Design OS/Layout/Region',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: regionArgs,
  argTypes: regionArgTypes,
};
export default meta;

const hidden = { table: { disable: true } };
const drawn = (story: 'Groups' | 'Plain' | 'Headless') => (args: Record<string, unknown>) => ({ Component: RegionStory, props: { ...args, story } });

/** Groups in a region's body: `gap` is the scale step between them (unset, the body adds none). */
export const Groups = {
  args: regionStoryArgs.Groups,
  argTypes: { view: hidden, disableSends: hidden },
  render: drawn('Groups'),
};

/** A plain region: a label in the header strip, content in the body, drawn by the theme's plate material. */
export const Plain = {
  args: regionStoryArgs.Plain,
  argTypes: { view: hidden, disableSends: hidden, gap: hidden },
  render: drawn('Plain'),
};

/** No header at all: no label, no aside, no views. */
export const Headless = {
  args: regionStoryArgs.Headless,
  argTypes: { view: hidden, disableSends: hidden, gap: hidden },
  render: drawn('Headless'),
};
