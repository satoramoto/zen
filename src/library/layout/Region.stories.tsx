import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withLibraryTheme } from '../storybook';
import { Region } from './Region';
import { Tabs } from './Tabs';

const note = (text: string) => <p style={{ margin: 0, color: 'var(--text-2)' }}>{text}</p>;

interface RegionArgs {
  name: string;
  label: string;
  aside: string;
  view: string;
  disableSends: boolean;
  onView: (id: string) => void;
}

const meta: Meta<RegionArgs> = {
  title: 'Design OS/Layout/Region',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { name: 'Mixer', label: 'Mixer', aside: '', view: 'faders', disableSends: false, onView: fn() },
  argTypes: {
    name: { control: 'text' },
    label: { control: 'text' },
    aside: { control: 'text' },
    view: { control: 'inline-radio', options: ['faders', 'sends', 'parts'] },
    disableSends: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<RegionArgs>;

/** A plain region: a label in the header strip, content in the body, drawn by the theme's plate material. */
export const Plain: Story = {
  args: { aside: '8 strips' },
  argTypes: { view: { table: { disable: true } }, disableSends: { table: { disable: true } } },
  render: ({ name, label, aside }) => (
    <div style={{ maxWidth: 560 }}>
      <Region name={name} label={label || undefined} aside={aside || undefined}>
        {note('The region body: groups of controls go here.')}
      </Region>
    </div>
  ),
};

/** No header at all: no label, no aside, no views. */
export const Headless: Story = {
  args: { label: '' },
  argTypes: { view: { table: { disable: true } }, disableSends: { table: { disable: true } } },
  render: ({ name, label, aside }) => (
    <div style={{ maxWidth: 560 }}>
      <Region name={name} label={label || undefined} aside={aside || undefined}>
        {note('A region with nothing in its header draws no header strip.')}
      </Region>
    </div>
  ),
};

function WithViewsDemo({ name, label, aside, view, disableSends, onView }: RegionArgs) {
  const [chosen, setChosen] = useState(view);
  useEffect(() => setChosen(view), [view]);
  return (
    <div style={{ maxWidth: 560 }}>
      <Region
        name={name}
        label={label || undefined}
        aside={aside || undefined}
        view={chosen}
        onView={(id) => {
          setChosen(id);
          onView(id);
        }}
      >
        <Region.View id="faders" label="Faders">
          {note('Faders: one strip per part.')}
        </Region.View>
        <Region.View id="sends" label="Sends" disabled={disableSends}>
          {note('Sends: reverb and delay per part.')}
        </Region.View>
        <Region.View id="parts" label="Parts">
          {note('Parts: voice, octave and transpose.')}
        </Region.View>
      </Region>
    </div>
  );
}

/** Views: the header shows a tab per view and the body only the chosen one. The `view` control (or a tab) chooses; `disableSends` shows a view that can't be chosen. */
export const WithViews: Story = {
  args: { label: '' },
  render: (args) => <WithViewsDemo {...args} />,
};

function SecondSwitch(args: RegionArgs) {
  const [layer, setLayer] = useState('a');
  return (
    <div style={{ maxWidth: 560 }}>
      <Region
        name={args.name}
        label={args.label || undefined}
        aside={
          <Tabs
            name="Layer"
            items={[
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ]}
            value={layer}
            onChange={setLayer}
          />
        }
      >
        {note(`Layer ${layer.toUpperCase()}: a second switch in the aside is the same object as the views' tabs.`)}
      </Region>
    </div>
  );
}

/** A second switch in the aside (the mixer's layers), using `Tabs`. */
export const AsideSwitch: Story = {
  argTypes: { view: { table: { disable: true } }, disableSends: { table: { disable: true } }, aside: { table: { disable: true } } },
  render: (args) => <SecondSwitch {...args} />,
};
