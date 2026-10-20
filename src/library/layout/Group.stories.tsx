import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pad } from '../components/music';
import { withLibraryTheme } from '../storybook';
import { Group } from './Group';
import { LABELS, UTILITY_GROUP, aligned, groupArgTypes, groupArgs, groupProps, groupStoryArgs, type GroupArgs } from './Group.fixtures';
import { Region } from './Region';

// Every story's args come from Group.fixtures.ts, which the Svelte stories and the parity test share.
const meta: Meta<GroupArgs> = {
  title: 'Design OS/Layout/Group',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: groupArgs,
  argTypes: groupArgTypes,
  render: (args) => (
    <div style={{ width: args.width }}>
      <Group {...groupProps(args)}>
        {LABELS.slice(0, args.count).map((label, i) => (
          <Pad key={label} label={label} family="main" state={i === 1 ? 'playing' : 'idle'} />
        ))}
      </Group>
    </div>
  ),
};
export default meta;
type Story = StoryObj<GroupArgs>;

/** A labelled cluster of controls: the header is the same in every group, the scale sets the spacing. */
export const Default: Story = { args: groupStoryArgs.Default };

/** An aside on the right of the header: a count or a page switch. */
export const WithAside: Story = { args: groupStoryArgs.WithAside };

/** Wrapping onto more lines when the row is full (narrow the width). */
export const Wrapping: Story = { args: groupStoryArgs.Wrapping };

/** A column, label hidden (the name stays for assistive tech). */
export const ColumnUnlabelled: Story = { args: groupStoryArgs.ColumnUnlabelled };

/** Groups inside a region: how they sit on a plate. */
export const InRegion: Story = {
  args: groupStoryArgs.InRegion,
  render: ({ direction, wrap, gap, align, count, width }) => (
    <div style={{ width }}>
      <Region name="Pads" label="Pads" gap={4}>
        <Group name="Sections" direction={direction} wrap={wrap} gap={gap} align={aligned(align)}>
          {LABELS.slice(0, count).map((label, i) => (
            <Pad key={label} label={label} family="main" state={i === 1 ? 'playing' : 'idle'} />
          ))}
        </Group>
        <Group name={UTILITY_GROUP.name} aside={UTILITY_GROUP.aside} gap={gap} align={aligned(align)}>
          <Pad label={UTILITY_GROUP.labels[0]} family="util" role={2} />
          <Pad label={UTILITY_GROUP.labels[1]} family="start" />
        </Group>
      </Region>
    </div>
  ),
};
