import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { BarBeat } from './BarBeat';

/**
 * The display's beat cells, one per beat, in neutral ink: past beats in `--text-3`, the current
 * beat lit in `--text-1` and taller, the rest at rest, beat 1 marked twice the line; stopped,
 * every cell at rest. Sections take no hue, so it looks the same in every section. As wide as its
 * container.
 */
const meta = {
  title: 'Design OS/Components/Music/BarBeat',
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
    hue: { table: { disable: true } },
  },
} satisfies Meta<typeof BarBeat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: beat 2 of 4 in Main C. */
export const Board: Story = {
  args: { beat: 2, beats: 4 },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('img', { name: 'Beat 2 of 4' });
    await expect(bar.querySelector('[data-state="current"]')).toBeTruthy();
  },
};

/** Counting in on an intro, beat 1: the same ink as any section. */
export const Intro: Story = { args: { beat: 1, beats: 4 } };

/** Stopped: every segment at rest. */
export const Stopped: Story = {
  args: { beat: 0, beats: 4 },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Stopped' })).toBeInTheDocument();
  },
};

/** A 3/4 ending on its last beat. */
export const ThreeFour: Story = { args: { beat: 3, beats: 3 } };

/**
 * Every section side by side, on beat 3 of 4, passing the old section `hue`: it is accepted and
 * ignored, so all five bars look the same.
 */
export const Sections: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, width: 320 }}>
      {(['intro', 'main', 'ending', 'brk', 'fill'] as const).map((hue) => (
        <BarBeat key={hue} beat={3} beats={4} hue={hue} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const bar of within(canvasElement).getAllByRole('img')) await expect(bar).not.toHaveAttribute('data-hue');
  },
};

/** A long bar: 7/8, beat 5. */
export const SevenEight: Story = { args: { beat: 5, beats: 7 } };

/** New: a thicker bar for reading across a room, `thickness` 6px; the lit beat stays three times it. */
export const Thick: Story = {
  args: { beat: 2, beats: 4, thickness: '6px' },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('img', { name: 'Beat 2 of 4' });
    await expect(bar.style.getPropertyValue('--yh-bar-beat-line')).toBe('6px');
  },
};
