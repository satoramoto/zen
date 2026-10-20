import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { Tabs, type TabsProps } from './Tabs';
import { tabsArgTypes, tabsStories as s } from './Tabs.fixtures';

/** Tabs holding its own choice, so a click or a key moves it (and `onChange` still logs). */
function TabsDemo({ value, onChange, ...rest }: TabsProps) {
  const [chosen, setChosen] = useState<string | null>(value);
  useEffect(() => setChosen(value), [value]);
  return (
    <Tabs
      {...rest}
      value={chosen}
      onChange={(id) => {
        setChosen(id);
        onChange(id);
      }}
    />
  );
}

const meta: Meta<TabsProps> = {
  title: 'Design OS/Layout/Tabs',
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
  args: { onChange: fn() },
  argTypes: tabsArgTypes,
  render: (args) => <TabsDemo {...args} />,
};
export default meta;
type Story = StoryObj<TabsProps>;

/** A well track with the chosen view raised as a key. ← → move, Home / End jump. */
export const Default: Story = { args: s.Default.args };

/** Two choices: the smallest switch (a layer A / B). */
export const Two: Story = { args: s.Two.args };

/** A disabled tab is shown but skipped by the arrows and clicks. */
export const WithDisabled: Story = { args: s.WithDisabled.args };

/** None chosen: the first enabled tab takes the tab stop. */
export const NoneChosen: Story = { args: s.NoneChosen.args };
