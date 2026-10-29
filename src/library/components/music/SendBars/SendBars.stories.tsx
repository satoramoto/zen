import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { SendBars } from './SendBars';
import SendBarsSvelte from './SendBars.svelte';
import { sendBarsArgTypes, sendBarsStories as s } from './SendBars.fixtures';

// Every story is built from SendBars.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it
// with React's or Svelte's `Tree`. A frame gives the bars a width (they fill what they are given),
// and Dense widens that frame to 900 px.

/** A story's width: 300 px, or the `frameWidth` parameter for a wide one. */
const frame: Decorator = (Story, { parameters }) => (
  <div style={{ width: parameters.frameWidth ?? 300 }}>
    <Story />
  </div>
);

// Every story is built from SendBars.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it
// with React's or Svelte's `Tree`.

/**
 * Two thin horizontal send bars — A over B — with a unity hinge at 0.75: how hard this track
 * feeds each effect. A press sets the bar, a drag carries it, the arrows nudge it.
 */
const meta = {
  title: 'Design OS/Components/Music/SendBars',
  component: SendBars,
  decorators: [withRenderer, frame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { sends: [0.4, 0.75] },
  argTypes: sendBarsArgTypes,
} satisfies Meta<typeof SendBars>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(SendBars, SendBarsSvelte);

/** A story that can be played: `onSend` a spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onSend: fn() },
});

/** Sends at 40 and at unity: a press on A moves it, and the bar reads back what the app gives it. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('slider', { name: 'A send' });
    await expect(bar).toHaveAttribute('aria-valuenow', '0.4');
    await userEvent.click(bar);
    await expect(args.onSend).toHaveBeenCalled();
  },
});

/** Every reading: empty, mid with hues, full, named pairs at and off unity. */
export const EveryState: Story = live(s.EveryState);

/** The same bars in a 900 px frame: they keep their hinge and fill the width given. */
export const Dense: Story = live(s.Dense, { parameters: { frameWidth: 900 } });

/** Both sends down: the hinge alone on each bar. */
export const Empty: Story = live(s.Empty);

/** Drawn but deaf: dimmed, no press fires. */
export const Disabled: Story = story(s.Disabled);
