import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pad } from '../components/music';
import type { Step } from '../primitives/step';
import { withLibraryTheme } from '../storybook';
import { Group } from './Group';
import { Region } from './Region';
import type { StackAlign } from './Stack';

const LABELS = ['Intro A', 'Main A', 'Main B', 'Fill A', 'Fill B', 'Break', 'Ending A', 'Ending B'];

interface GroupArgs {
  name: string;
  showLabel: boolean;
  aside: string;
  direction: 'row' | 'column';
  wrap: boolean;
  gap: Step;
  align: StackAlign | 'unset';
  count: number;
  width: number;
}

const aligned = (align: GroupArgs['align']) => (align === 'unset' ? undefined : align);

const meta: Meta<GroupArgs> = {
  title: 'Design OS/Layout/Group',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { name: 'Sections', showLabel: true, aside: '', direction: 'row', wrap: false, gap: 2, align: 'unset', count: 4, width: 560 },
  argTypes: {
    name: { control: 'text' },
    showLabel: { control: 'boolean' },
    aside: { control: 'text' },
    direction: { control: 'inline-radio', options: ['row', 'column'] },
    wrap: { control: 'boolean' },
    gap: { control: { type: 'range', min: 0, max: 6, step: 1 } },
    align: { control: 'inline-radio', options: ['unset', 'start', 'center', 'end', 'stretch', 'baseline'] },
    count: { control: { type: 'range', min: 1, max: LABELS.length, step: 1 } },
    width: { control: { type: 'range', min: 200, max: 900, step: 10 } },
  },
  render: ({ name, showLabel, aside, direction, wrap, gap, align, count, width }) => (
    <div style={{ width }}>
      <Group
        name={name}
        label={showLabel ? undefined : false}
        aside={aside || undefined}
        direction={direction}
        wrap={wrap}
        gap={gap}
        align={aligned(align)}
      >
        {LABELS.slice(0, count).map((label, i) => (
          <Pad key={label} label={label} family="main" state={i === 1 ? 'playing' : 'idle'} />
        ))}
      </Group>
    </div>
  ),
};
export default meta;
type Story = StoryObj<GroupArgs>;

/** A labelled cluster of controls: the header is the same in every group, the scale sets the spacing. */
export const Default: Story = {};

/** An aside on the right of the header: a count or a page switch. */
export const WithAside: Story = { args: { aside: '1 / 2' } };

/** Wrapping onto more lines when the row is full (narrow the width). */
export const Wrapping: Story = { args: { count: 8, wrap: true, width: 360 } };

/** A column, label hidden (the name stays for assistive tech). */
export const ColumnUnlabelled: Story = { args: { direction: 'column', showLabel: false, count: 3, width: 200 } };

/** Groups inside a region: how they sit on a plate. */
export const InRegion: Story = {
  render: ({ direction, wrap, gap, align, count, width }) => (
    <div style={{ width }}>
      <Region name="Pads" label="Pads" gap={4}>
        <Group name="Sections" direction={direction} wrap={wrap} gap={gap} align={aligned(align)}>
          {LABELS.slice(0, count).map((label, i) => (
            <Pad key={label} label={label} family="main" state={i === 1 ? 'playing' : 'idle'} />
          ))}
        </Group>
        <Group name="Utility" aside="Transport" gap={gap} align={aligned(align)}>
          <Pad label="Sync Start" family="util" role={2} />
          <Pad label="Start / Stop" family="start" />
        </Group>
      </Region>
    </div>
  ),
};
