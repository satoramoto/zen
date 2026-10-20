import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { SendReadout } from './SendReadout';
import { sendReadoutArgTypes, sendReadoutBase, sendReadoutStories as s } from './SendReadout.fixtures';

const meta = {
  title: 'Design OS/Components/Music/SendReadout',
  component: SendReadout,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { ...sendReadoutBase, onPress: fn() },
  argTypes: sendReadoutArgTypes,
} satisfies Meta<typeof SendReadout>;

export default meta;
type Story = StoryObj<typeof meta>;

// Every story's args come from SendReadout.fixtures.ts, which the Svelte stories and the parity test share.

/** The board: Reverb 40 Chorus 12 Delay 0 ("Band" leads the spoken name only). */
export const Board: Story = {
  args: s.Board.args,
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
export const Full: Story = {
  args: s.Full.args,
};

/** Every send off: all three levels step back to muted text. */
export const AllOff: Story = {
  args: s.AllOff.args,
};
