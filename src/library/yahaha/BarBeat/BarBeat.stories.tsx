import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { BarBeat } from './BarBeat';

const HUES = ['intro', 'main', 'ending', 'brk', 'fill'];

/**
 * The display's beat bar: a segment per beat of the bar in the playing section's hue: past beats
 * filled, the current beat lit and taller, the rest at rest; stopped, every segment at rest. As
 * wide as its container.
 */
const meta = {
  title: 'Library/Yahaha/Primitives/BarBeat',
  component: BarBeat,
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  render: (args) => (
    <div style={{ width: 320 }}>
      <BarBeat {...args} />
    </div>
  ),
  argTypes: {
    beat: { control: { type: 'range', min: 0, max: 12, step: 1 } },
    beats: { control: { type: 'number', min: 1, max: 12, step: 1 } },
    hue: { control: 'select', options: HUES },
  },
} satisfies Meta<typeof BarBeat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: beat 2 of 4 in Main C. */
export const Board: Story = {
  args: { beat: 2, beats: 4, hue: 'main' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Beat 2 of 4' })).toBeInTheDocument();
  },
};

/** Counting in on an intro, beat 1. */
export const Intro: Story = { args: { beat: 1, beats: 4, hue: 'intro' } };

/** Stopped: every segment at rest. */
export const Stopped: Story = {
  args: { beat: 0, beats: 4, hue: 'main' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Stopped' })).toBeInTheDocument();
  },
};

/** A 3/4 ending on its last beat. */
export const ThreeFour: Story = { args: { beat: 3, beats: 3, hue: 'ending' } };

/** Every section's hue side by side, on beat 3 of 4. */
export const Sections: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, width: 320 }}>
      {(['intro', 'main', 'ending', 'brk', 'fill'] as const).map((hue) => (
        <BarBeat key={hue} beat={3} beats={4} hue={hue} />
      ))}
    </div>
  ),
};

/** A long bar: 7/8, beat 5. */
export const SevenEight: Story = { args: { beat: 5, beats: 7, hue: 'fill' } };
