import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from '../components/core';
import { withLibraryTheme } from '../storybook';
import { Group } from './Group';
import { Region } from './Region';
import { REGION_GROUPS, REGION_NOTES, regionArgTypes, regionArgs, regionProps, regionStoryArgs, type RegionArgs as RegionData } from './Region.fixtures';
import { Tabs } from './Tabs';

const note = (text: string) => <p style={{ margin: 0, color: 'var(--text-2)' }}>{text}</p>;

// Every story's args come from Region.fixtures.ts, which the Svelte stories and the parity test share.
interface RegionArgs extends RegionData {
  onView: (id: string) => void;
}

const meta: Meta<RegionArgs> = {
  title: 'Design OS/Layout/Region',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { ...regionArgs, onView: fn() },
  argTypes: regionArgTypes,
};
export default meta;
type Story = StoryObj<RegionArgs>;

/** Groups in a region's body: `gap` is the scale step between them (unset, the body adds none). */
export const Groups: Story = {
  args: regionStoryArgs.Groups,
  argTypes: { view: { table: { disable: true } }, disableSends: { table: { disable: true } } },
  render: (args) => (
    <div style={{ maxWidth: 560 }}>
      <Region {...regionProps(args, true)}>
        {REGION_GROUPS.map((g) => (
          <Group key={g.name} name={g.name}>
            {g.labels.map((l, i) => (
              <Button key={l} label={l} variant={g.name === 'Transport' && i === 1 ? 'primary' : undefined} />
            ))}
          </Group>
        ))}
      </Region>
    </div>
  ),
};

/** A plain region: a label in the header strip, content in the body, drawn by the theme's plate material. */
export const Plain: Story = {
  args: regionStoryArgs.Plain,
  argTypes: { view: { table: { disable: true } }, disableSends: { table: { disable: true } }, gap: { table: { disable: true } } },
  render: (args) => (
    <div style={{ maxWidth: 560 }}>
      <Region {...regionProps(args)}>{note(REGION_NOTES.Plain)}</Region>
    </div>
  ),
};

/** No header at all: no label, no aside, no views. */
export const Headless: Story = {
  args: regionStoryArgs.Headless,
  argTypes: { view: { table: { disable: true } }, disableSends: { table: { disable: true } }, gap: { table: { disable: true } } },
  render: (args) => (
    <div style={{ maxWidth: 560 }}>
      <Region {...regionProps(args)}>{note(REGION_NOTES.Headless)}</Region>
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
  args: regionStoryArgs.WithViews,
  argTypes: { gap: { table: { disable: true } } },
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
  args: regionStoryArgs.AsideSwitch,
  argTypes: { view: { table: { disable: true } }, disableSends: { table: { disable: true } }, aside: { table: { disable: true } }, gap: { table: { disable: true } } },
  render: (args) => <SecondSwitch {...args} />,
};
