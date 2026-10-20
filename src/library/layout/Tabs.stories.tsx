import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { fixtureStories, withRenderer } from '../stories/story';
import { Tabs, type TabsProps } from './Tabs';
import TabsSvelte from './Tabs.svelte';
import { tabsArgTypes, tabsStories as s } from './Tabs.fixtures';

/** Tabs holding its own choice: a click or a key moves `value` in the story's args (and `onChange`
 *  still logs), for whichever renderer draws it. Outside `withRenderer`, so both see the new args. */
const holdChoice: Decorator = (Story, { args }) => {
  const [, updateArgs] = useArgs();
  const onChange = (id: string) => {
    (args as Partial<TabsProps>).onChange?.(id);
    updateArgs({ value: id });
  };
  return Story({ args: { ...args, onChange } });
};

// Every story is built from Tabs.fixtures.ts (`story(s.Name)`), which the tree snapshot shares; the
// toolbar's Renderer draws it with React's or Svelte's `Tree`.
const meta: Meta<TabsProps> = {
  title: 'Design OS/Layout/Tabs',
  component: Tabs,
  decorators: [withRenderer, holdChoice, withLibraryTheme],
  parameters: { layout: 'padded' },
  args: { onChange: fn() },
  argTypes: tabsArgTypes,
};
export default meta;
type Story = StoryObj<TabsProps>;
const story = fixtureStories<Story>(Tabs, TabsSvelte);

/** A well track with the chosen view raised as a key. ← → move, Home / End jump. */
export const Default: Story = story(s.Default);

/** Two choices: the smallest switch (a layer A / B). */
export const Two: Story = story(s.Two);

/** A disabled tab is shown but skipped by the arrows and clicks. */
export const WithDisabled: Story = story(s.WithDisabled);

/** None chosen: the first enabled tab takes the tab stop. */
export const NoneChosen: Story = story(s.NoneChosen);
