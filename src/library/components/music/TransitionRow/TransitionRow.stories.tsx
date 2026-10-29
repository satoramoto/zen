import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { FormProvider } from '../../../layout/assembly';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { TransitionRow } from './TransitionRow';
import TransitionRowSvelte from './TransitionRow.svelte';
import { transitionBoard, transitionRowArgTypes, transitionRowStories as s } from './TransitionRow.fixtures';

// Every story is built from TransitionRow.fixtures.ts (`story(s.Name)`); the toolbar's Renderer
// draws it with React's or Svelte's `Tree`. The greedy story is the Disabled one: with no `onFire`
// the row is inert, so it takes no spy.

/**
 * Six oversized transition pads (`RISER / DROP / CRASH / HOLD A / HOLD B / CUT`) for a live set.
 * Idle is a quiet key; armed keeps the face and adds an inset ring in the pad's hue slot, a faint
 * wash and one lit lamp; fired fills the face with the hue slot and inks the words `on-solid`. A
 * click asks for `onFire(id)` and changes nothing itself.
 */
const meta = {
  title: 'Design OS/Components/Music/TransitionRow',
  component: TransitionRow,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  // Fullscreen: the row is a stage surface, so it must be judged at the width it will have
  // (six pads sharing 1440 px), not shrink-wrapped to its labels by a centred frame.
  parameters: { layout: 'fullscreen', frame: { w: 1440, h: 160 } },
  args: { pads: transitionBoard },
  argTypes: transitionRowArgTypes,
} satisfies Meta<typeof TransitionRow>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(TransitionRow, TransitionRowSvelte);

/** A story with a fire spy: its fixture's args, plus `onFire`. */
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onFire: fn() },
});

/** The row at rest: six idle pads in one line, each at least two control heights tall. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const riser = canvas.getByRole('button', { name: 'RISER, 8 bars' });
    await expect(riser).toHaveAttribute('data-state', 'idle');
    await userEvent.click(riser);
    await expect(args.onFire).toHaveBeenCalledWith('riser');
    // Controlled: a click asks, the app changes the pad, the row itself stays idle.
    await expect(riser).toHaveAttribute('data-state', 'idle');
  },
});

/** Every state at once, with DROP marked current: RISER and HOLD B armed, DROP, HOLD A and CUT
 *  fired (CUT has no hue slot, so its fired face fills `--role-2`), CRASH idle. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const states = canvas.getAllByRole('button').map((pad) => pad.getAttribute('data-state'));
    await expect(states).toEqual(['armed', 'fired', 'idle', 'fired', 'armed', 'fired']);
    await expect(canvas.getByRole('button', { name: 'DROP, next bar' })).toHaveAttribute('aria-current', 'true');
  },
});

/** Added: the grid form — two rows of three — in a 900 px frame, where one line of six would be too
 *  narrow. A form of its own, so React draws it. */
export const Dense: Story = story(s.Dense, {
  parameters: { layout: 'fullscreen', frame: { w: 900, h: 420 } },
  render: (args) => (
    <div style={{ padding: 'var(--space-4)' }}>
      <FormProvider form="grid">
        <TransitionRow {...args} />
      </FormProvider>
    </div>
  ),
});

/** Added: no pads — a surface with no transitions bound yet — drawn as one dashed, quiet line. */
export const Empty: Story = live(s.Empty, {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No transitions')).toBeInTheDocument();
  },
});

/** Added: no `onFire`, so the row is inert: every pad `aria-disabled`, dashed and muted, and a
 *  click asks for nothing. */
export const Disabled: Story = {
  ...story(s.Disabled),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const riser = canvas.getByRole('button', { name: 'RISER, 8 bars' });
    await expect(riser).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(riser);
    await expect(canvas.getAllByRole('button').every((pad) => pad.getAttribute('aria-disabled') === 'true')).toBe(true);
  },
};
