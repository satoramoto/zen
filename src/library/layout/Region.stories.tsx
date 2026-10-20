import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { treeStory, withRenderer, type StoryView } from '../stories/story';
import { regionArgTypes, regionArgs, regionSample, regionStoryArgs, type RegionArgs as RegionData, type RegionStory } from './Region.fixtures';

// Every story is a view tree built in Region.fixtures.ts (`regionSample`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`.
interface RegionArgs extends RegionData {
  onView: (id: string) => void;
  onLayer: (id: string) => void;
}

const meta: Meta<RegionArgs> = {
  title: 'Design OS/Layout/Region',
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { ...regionArgs, onView: fn(), onLayer: fn() },
  argTypes: regionArgTypes,
};
export default meta;
type Story = StoryObj<RegionArgs>;

/** The story's tree, its tabs' callbacks the spies. */
const sample =
  (story: RegionStory): StoryView<RegionArgs> =>
  (args) => ({ tree: regionSample({ ...args, story }), handlers: { view: (id: string) => args.onView(id), layer: (id: string) => args.onLayer(id) } });

const hidden = { table: { disable: true } };

/** Groups in a region's body: `gap` is the scale step between them (unset, the body adds none). */
export const Groups: Story = {
  ...treeStory(sample('Groups')),
  args: regionStoryArgs.Groups,
  argTypes: { view: hidden, disableSends: hidden, layer: hidden },
};

/** A plain region: a label in the header strip, content in the body, drawn by the theme's plate material. */
export const Plain: Story = {
  ...treeStory(sample('Plain')),
  args: regionStoryArgs.Plain,
  argTypes: { view: hidden, disableSends: hidden, gap: hidden, layer: hidden },
};

/** No header at all: no label, no aside, no views. */
export const Headless: Story = {
  ...treeStory(sample('Headless')),
  args: regionStoryArgs.Headless,
  argTypes: { view: hidden, disableSends: hidden, gap: hidden, layer: hidden },
};

/** Views: the header shows a tab per view and the body only the chosen one. The `view` control chooses (a tab asks `onView`); `disableSends` shows a view that can't be chosen. */
export const WithViews: Story = {
  ...treeStory(sample('WithViews')),
  args: regionStoryArgs.WithViews,
  argTypes: { gap: hidden, layer: hidden },
};

/** A second switch in the aside (the mixer's layers), using `Tabs`: the `layer` control chooses (a tab asks `onLayer`). */
export const AsideSwitch: Story = {
  ...treeStory(sample('AsideSwitch')),
  args: regionStoryArgs.AsideSwitch,
  argTypes: { view: hidden, disableSends: hidden, aside: hidden, gap: hidden },
};
