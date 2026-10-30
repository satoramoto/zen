import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { OrbitClock } from './OrbitClock';
import OrbitClockSvelte from './OrbitClock.svelte';
import { orbitClockArgTypes, orbitClockBoard, orbitClockStories as s } from './OrbitClock.fixtures';

// Every story is built from OrbitClock.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws
// it with React's or Svelte's `Tree`. Disabled is the clock with no callbacks: read-only.

/**
 * The generators in time, together, in mix[flow]'s face: a thin ring per generator, beads for its
 * steps, a hand at its own cycle length; the hub says the chord and when the hands meet again.
 */
const meta = {
  id: 'music-live-orbit-clock',
  title: 'Music/Live/Orbit clock',
  component: OrbitClock,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 720, h: 440 } },
  args: orbitClockBoard,
  argTypes: orbitClockArgTypes,
} satisfies Meta<typeof OrbitClock>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(OrbitClock, OrbitClockSvelte);

/** A story with every callback a spy. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onSelect: fn(), onMutate: fn(), onShake: fn(), onKeep: fn(), onRevert: fn() },
});

/** Bar 6, Bass selected. A ring, its row and the keyboard each ask to select; the dice ask their own. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Am7')).toBeTruthy();
    await expect(canvas.getByText('meet in 10 bars')).toBeTruthy();
    const ring = canvas.getByRole('button', { name: 'Drums: EUCLID E(5,16) · kick' });
    await userEvent.click(ring);
    await expect(args.onSelect).toHaveBeenCalledWith('drums');
    ring.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSelect).toHaveBeenCalledTimes(2);
    await userEvent.click(canvas.getByRole('button', { name: 'Keys generator, ARP' }));
    await expect(args.onSelect).toHaveBeenLastCalledWith('keys');
    await expect(canvas.getByRole('button', { name: 'Bass generator, EUCLID' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Mutate' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Shake all' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Keep' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Revert' }));
    for (const spy of [args.onMutate, args.onShake, args.onKeep, args.onRevert]) await expect(spy).toHaveBeenCalledTimes(1);
  },
});

/** Hits lit and rests passed under the hands, a selected ring, chaos high. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const states = new Set([...canvasElement.querySelectorAll('.live-orbit-bead')].map((b) => b.getAttribute('data-state')));
    await expect(states).toEqual(new Set(['hit', 'rest', 'lit', 'passing']));
    await expect(canvasElement.querySelector('[data-part="chaos"]')).toBeTruthy();
  },
});

/** Beat 0: every hand at twelve together, no chaos. */
export const Together: Story = live(s.Together, {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('together now')).toBeTruthy();
    await expect(canvasElement.querySelector('[data-part="chaos"]')).toBeNull();
  },
});

/** Eight generators: the rings packed close. */
export const Crowded: Story = live(s.Crowded);

/** The `orbits` form in a small square: the rings alone. */
const dense = live(s.Dense, {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-part="side"]')).toBeNull();
    await expect(within(canvasElement).getAllByRole('button')).toHaveLength(5);
  },
});
export const Dense: Story = { ...dense, parameters: { ...dense.parameters, frame: { w: 320, h: 320 } } };

/** No generators: an empty hub. */
export const Empty: Story = story(s.Empty);

/** No callbacks: the rings aren't buttons, the rows and dice are disabled. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
    await expect(canvasElement.querySelector('.live-orbit-ring[role="button"]')).toBeNull();
  },
});
