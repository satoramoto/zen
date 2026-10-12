import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { SendReadout } from './SendReadout';

const meta = {
  title: 'Design OS/Components/Music/SendReadout',
  component: SendReadout,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: { reverb: 40, chorus: 12, delay: 0, tip: 'display.band_sends', onPress: fn() },
  argTypes: {
    reverb: { control: { type: 'range', min: 0, max: 127, step: 1 } },
    chorus: { control: { type: 'range', min: 0, max: 127, step: 1 } },
    delay: { control: { type: 'range', min: 0, max: 127, step: 1 } },
    label: { control: 'text' },
    name: { control: 'text' },
    tip: { control: 'text' },
  },
} satisfies Meta<typeof SendReadout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The board: Reverb 40 Chorus 12 Delay 0 ("Band" leads the spoken name only). */
export const Board: Story = {
  args: { reverb: 40, chorus: 12, delay: 0, label: 'Band' },
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
  args: { reverb: 127, chorus: 127, delay: 127 },
};

/** Every send off: all three levels step back to muted text. */
export const AllOff: Story = {
  args: { reverb: 0, chorus: 0, delay: 0 },
};
