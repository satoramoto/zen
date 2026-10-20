import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { treeStory, withRenderer } from '../../../stories/story';
import { BarBeat, type BarBeatProps } from './BarBeat';
import { barBeatArgTypes, barBeatSample, barBeatSectionsSample, barBeatStories as s } from './BarBeat.fixtures';

// Every story's args come from BarBeat.fixtures.ts, which the tree snapshot shares. The bar fills
// its container, so each story is a view tree (a 320px column, `barBeatSample`) that the toolbar's
// Renderer draws with React's or Svelte's `Tree`.
const one = treeStory((args: BarBeatProps) => ({ tree: barBeatSample(args) }));

/**
 * The display's beat cells, one per beat, in neutral ink: past beats in `--text-3`, the current
 * beat lit in `--text-1` and taller, the rest at rest, beat 1 marked twice the line; stopped,
 * every cell at rest. Sections take no hue, so it looks the same in every section. As wide as its
 * container.
 */
const meta = {
  title: 'Design OS/Components/Music/BarBeat',
  component: BarBeat,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered', ...one.parameters },
  render: one.render,
  argTypes: barBeatArgTypes,
} satisfies Meta<typeof BarBeat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: beat 2 of 4 in Main C. */
export const Board: Story = {
  args: s.Board.args,
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('img', { name: 'Beat 2 of 4' });
    await expect(bar.querySelector('[data-state="current"]')).toBeTruthy();
  },
};

/** Counting in on an intro, beat 1: the same ink as any section. */
export const Intro: Story = { args: s.Intro.args };

/** Stopped: every segment at rest. */
export const Stopped: Story = {
  args: s.Stopped.args,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Stopped' })).toBeInTheDocument();
  },
};

/** A 3/4 ending on its last beat. */
export const ThreeFour: Story = { args: s.ThreeFour.args };

/**
 * Every section side by side, on beat 3 of 4, passing the old section `hue`: it is accepted and
 * ignored, so all five bars look the same.
 */
export const Sections: Story = {
  ...treeStory(() => ({ tree: barBeatSectionsSample() })),
  play: async ({ canvasElement }) => {
    for (const bar of within(canvasElement).getAllByRole('img')) await expect(bar).not.toHaveAttribute('data-hue');
  },
};

/** A long bar: 7/8, beat 5. */
export const SevenEight: Story = { args: s.SevenEight.args };

/** New: a thicker bar for reading across a room, `thickness` 6px; the lit beat stays three times it. */
export const Thick: Story = {
  args: s.Thick.args,
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('img', { name: 'Beat 2 of 4' });
    await expect(bar.style.getPropertyValue('--yh-bar-beat-line')).toBe('6px');
  },
};
