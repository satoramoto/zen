import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { MixBand } from './MixBand';
import MixBandSvelte from './MixBand.svelte';
import { mixBandArgTypes, mixBandStories as s, mixBoard, mixReturns } from './MixBand.fixtures';

// Every story is built from MixBand.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it
// with React's or Svelte's `Tree`.

/**
 * The mix as a column-aligned band: one strip per track (name, meter, fader, two sends,
 * M / S / Arm), then the effect returns. Controlled: faders, bars and lamps only ask.
 */
const meta = {
  title: 'Design OS/Components/Music/MixBand',
  component: MixBand,
  decorators: [withRenderer, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { tracks: mixBoard, sends: mixReturns },
  argTypes: mixBandArgTypes,
} satisfies Meta<typeof MixBand>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(MixBand, MixBandSvelte);

/** A story that can be played: every callback a spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onLevel: fn(), onSend: fn(), onReturn: fn(), onArm: fn(), onMute: fn(), onSolo: fn(), onSelect: fn() },
});

/** Eight strips and two returns: Bass muted, Vox soloed, Keys armed, FX parked. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const mute = canvas.getByRole('button', { name: 'Drums mute' });
    await userEvent.click(mute);
    await expect(args.onMute).toHaveBeenCalledWith('drums');
  },
});

/** Muted, soloed, armed-and-parked strips at once. */
export const EveryState: Story = live(s.EveryState);

/** Four strips and one return: the `short` form in a narrow frame. */
export const Dense: Story = live(s.Dense);

/** No strips, no returns: the band's empty face. */
export const Empty: Story = live(s.Empty);

/** Drawn but deaf: dimmed, nothing fires. */
export const Disabled: Story = story(s.Disabled);
