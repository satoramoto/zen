import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { LandingDial, type LandingDialProps } from './LandingDial';
import LandingDialSvelte from './LandingDial.svelte';
import { landingDialArgTypes, landingDialBoard, landingDialStories as s } from './LandingDial.fixtures';

// Every story is built from LandingDial.fixtures.ts (`story(s.Name)`); the toolbar's Renderer
// draws it with React's or Svelte's `Tree`. Disabled is the dial with no callbacks: read-only.

/**
 * "When does it land, and on what?" in mix[flow]'s face: a countdown ring of bar cells, the bars
 * gone solid, the bar now filling with the beat, the bars left in big mono in the middle.
 */
const meta = {
  id: 'music-live-landing-dial',
  title: 'Music/Live/Landing dial',
  component: LandingDial,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 300, h: 420 } },
  args: landingDialBoard,
  argTypes: landingDialArgTypes,
} satisfies Meta<typeof LandingDial>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(LandingDial, LandingDialSvelte);

/** A story with every spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onTarget: fn(), onLength: fn(), onCancel: fn() },
});

/** RISER into Wire, three bars left: the switches ask for the next target and length, Cancel asks to cancel. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: 'RISER lands on Wire in 3 bars' })).toBeTruthy();
    const bars = canvasElement.querySelectorAll('.live-land-bar');
    await expect([...bars].map((b) => b.getAttribute('data-state'))).toEqual(['gone', 'gone', 'gone', 'gone', 'gone', 'now', 'ahead', 'ahead']);
    await userEvent.click(canvas.getByRole('radio', { name: 'Next section' }));
    await expect(args.onTarget).toHaveBeenCalledWith('section');
    await userEvent.click(canvas.getByRole('radio', { name: '16' }));
    await expect(args.onLength).toHaveBeenCalledWith(16);
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
});

/** The last bar of a fill, three beats in: one bar to land, the downbeat next. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('bar to land')).toBeTruthy();
    await expect(canvasElement.querySelector('.live-land-bar[data-down]')).toHaveAttribute('data-state', 'now');
  },
});

/** Sixteen bars, all ahead: a long build just armed. */
export const Long: Story = live(s.Long);

/** Not armed: a dashed ring, Cancel disabled. */
export const Disarmed: Story = live(s.Disarmed, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByText('not armed').length).toBeGreaterThan(0);
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  },
});

/** The `chip` form in a narrow strip: one line. */
const dense = live(s.Dense, {
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('status', { name: 'RISER lands on Wire in 3 bars' })).toBeTruthy();
      await expect(canvas.getByText('RISER → Wire')).toBeTruthy();
      await expectFits(canvasElement);
    },
});
export const Dense: Story = { ...dense, parameters: { ...dense.parameters, frame: { w: 220, h: 32 } } };

/** Nothing queued: no countdown is drawn, and nothing can be cancelled. */
export const Empty: Story = story(s.Empty, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('img', { name: / lands on / })).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  },
});

/** No callbacks: the switches and Cancel disabled. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const radio of canvas.getAllByRole('radio')) await expect(radio).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  },
});

/** A host that takes the target and length a switch asks for, and disarms on Cancel. */
const landing = host<LandingDialProps>({
  apply: {
    onTarget: (_, target: LandingDialProps['target']) => ({ target }),
    onLength: (_, length: LandingDialProps['length']) => ({ length }),
    onCancel: () => ({ armed: false }),
  },
});

/**
 * Controlled readback: a click or the arrow keys on a switch ask for a target or a length, and the
 * switch reads checked once the host takes it. Cancel asks; the ring reads not armed only when the
 * host disarms. Nothing here counts down: the bars and beat are the host's.
 */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...landing },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Next section' }));
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Next section' })).toHaveAttribute('aria-checked', 'true'));
    await expect(canvas.getByRole('radio', { name: 'Next song' })).toHaveAttribute('aria-checked', 'false');
    canvas.getByRole('radio', { name: 'Next section' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Next scene' })).toHaveAttribute('aria-checked', 'true'));
    await expect(args.onTarget).toHaveBeenLastCalledWith('scene');
    await userEvent.click(canvas.getByRole('radio', { name: '16' }));
    await waitFor(() => expect(canvas.getByRole('radio', { name: '16' })).toHaveAttribute('aria-checked', 'true'));
    await expect(canvasElement.querySelectorAll('.live-land-bar')).toHaveLength(16);
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled());
    await expect(canvas.getAllByText('not armed').length).toBeGreaterThan(0);
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
});
