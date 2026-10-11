import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { BarBeat } from './BarBeat';

/**
 * The display's beat bar: a segment per beat of the bar in the playing role (`--selected`): past
 * beats filled, the current beat lit and taller, the rest at rest; stopped, every segment at rest.
 * Sections take no hue, so it looks the same in every section. As wide as its container.
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
    await expect(bar.style.getPropertyValue('--yh-bar-beat-tone')).toBe('var(--selected)');
  },
};

/** Counting in on an intro, beat 1: the same playing role as any section. */
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
 * ignored, so all five bars wear the same playing role.
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
    const tones = within(canvasElement)
      .getAllByRole('img')
      .map((bar) => bar.style.getPropertyValue('--yh-bar-beat-tone'));
    await expect(new Set(tones)).toEqual(new Set(['var(--selected)']));
  },
};

/** A long bar: 7/8, beat 5. */
export const SevenEight: Story = { args: { beat: 5, beats: 7 } };
