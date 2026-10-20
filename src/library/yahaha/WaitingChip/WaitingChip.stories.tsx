import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { WaitingChip } from './WaitingChip';
import WaitingChipSvelte from './WaitingChip.svelte';
import { waitingChipArgTypes, waitingChipStories as s } from './WaitingChip.fixtures';

// Every story is built from WaitingChip.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`. The plays are the behaviours.
const meta = {
  title: 'Yahaha/Primitives/WaitingChip',
  component: WaitingChip,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: waitingChipArgTypes,
} satisfies Meta<typeof WaitingChip>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(WaitingChip, WaitingChipSvelte);

/** The count row's next section, Main: an arrow in the "next" role (`--accent`) before "Main C"; sections take no hue. */
export const Board: Story = {
  ...story(s.Board),
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByText('Main C');
    await expect(chip).toHaveAttribute('data-face', 'waiting');
    await expect(chip).toHaveAttribute('data-hue', 'main');
    await expect(chip.style.getPropertyValue('--yh-waiting-chip-hue')).toBe('var(--accent)');
    await expect(chip).toHaveAttribute('data-size', 'count');
    await expect(within(canvasElement).queryByRole('button')).toBeNull();
    await expect(canvasElement.querySelector('a[href], button, input, select, textarea, [tabindex]')).toBeNull();
  },
};

/** The next section on the display (`t`), in the display face, its arrow in `--accent` (next, by default). */
export const Display: Story = story(s.Display);

/** The style line's queued style, waiting for the bar line: an accent arrow before "Coastal Highway". */
export const QueuedStyle: Story = {
  ...story(s.QueuedStyle),
  play: async ({ canvasElement }) => {
    const chip = within(canvasElement).getByText('Coastal Highway');
    await expect(chip).toHaveAttribute('data-hue', 'a');
    await expect(chip).toHaveAttribute('data-size', 'line');
  },
};

const empty = story(s.Empty);

/** Nothing waiting: an empty label draws nothing at all. */
export const Empty: Story = {
  ...empty,
  parameters: { ...empty.parameters, rendersNothing: true },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-face]')).toBeNull();
  },
};

/** A long style name on the style line: capped and ended with "…"; the full name is still its text. */
export const LongStyle: Story = {
  ...story(s.LongStyle),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Coastal Highway Cruise Unplugged Ballad')).toBeInTheDocument();
  },
};

/**
 * Every hue at the count size, to compare the arrows under each pack: every section and the
 * queued style share the "next" role; only `t` is neutral.
 */
export const AllHues: Story = story(s.AllHues);
