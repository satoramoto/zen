import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { Tabs, type TabItem } from './Tabs';

const VIEWS: TabItem[] = [
  { id: 'faders', label: 'Faders' },
  { id: 'sends', label: 'Sends' },
  { id: 'parts', label: 'Parts' },
  { id: 'fx', label: 'Effects' },
];

interface TabsArgs {
  name: string;
  count: number;
  value: string;
  disableSecond: boolean;
  onChange: (id: string) => void;
}

function TabsDemo({ name, count, value, disableSecond, onChange }: TabsArgs) {
  const [chosen, setChosen] = useState<string | null>(value || null);
  useEffect(() => setChosen(value || null), [value]);
  const items = VIEWS.slice(0, count).map((t, i) => (i === 1 && disableSecond ? { ...t, disabled: true } : t));
  return (
    <Tabs
      name={name}
      items={items}
      value={chosen}
      onChange={(id) => {
        setChosen(id);
        onChange(id);
      }}
    />
  );
}

const meta: Meta<TabsArgs> = {
  title: 'Design OS/Layout/Tabs',
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
  args: { name: 'Mixer view', count: 3, value: 'faders', disableSecond: false, onChange: fn() },
  argTypes: {
    name: { control: 'text' },
    count: { control: { type: 'range', min: 2, max: 4, step: 1 } },
    value: { control: 'select', options: ['', ...VIEWS.map((t) => t.id)] },
    disableSecond: { control: 'boolean' },
  },
  render: (args) => <TabsDemo {...args} />,
};
export default meta;
type Story = StoryObj<TabsArgs>;

/** A well track with the chosen view raised as a key. ← → move, Home / End jump. */
export const Default: Story = {};

/** Two choices: the smallest switch (a layer A / B). */
export const Two: Story = { args: { count: 2, name: 'Layer' } };

/** A disabled tab is shown but skipped by the arrows and clicks. */
export const WithDisabled: Story = { args: { disableSecond: true, count: 4 } };

/** None chosen: the first enabled tab takes the tab stop. */
export const NoneChosen: Story = { args: { value: '' } };
