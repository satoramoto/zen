import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { SendReadout } from './SendReadout';
import SendReadoutSvelte from './SendReadout.svelte';
import { sendReadoutArgTypes, sendReadoutBase, sendReadoutStories as s } from './SendReadout.fixtures';

const meta = {
  title: 'Design OS/Components/Music/SendReadout',
  component: SendReadout,
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { ...sendReadoutBase, onPress: fn() },
  argTypes: sendReadoutArgTypes,
} satisfies Meta<typeof SendReadout>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(SendReadout, SendReadoutSvelte);

// Every story is built from SendReadout.fixtures.ts (`story(s.Name)`), which the tree snapshot
// shares; the toolbar's Renderer draws it with React's or Svelte's `Tree`.

/** The board: Reverb 40 Chorus 12 Delay 0 ("Band" leads the spoken name only). */
export const Board: Story = {
  ...story(s.Board),
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', {
      name: 'Band sends: reverb 40, chorus 12, delay 0. Opens Effects',
    });
    await expect(button).toHaveAttribute('data-tip', 'display.band_sends');
    await userEvent.click(button);
    await expect(args.onPress).toHaveBeenCalledTimes(1);
  },
};

/** Every send at its top. */
export const Full: Story = story(s.Full);

/** Every send off: all three levels step back to muted text. */
export const AllOff: Story = story(s.AllOff);
