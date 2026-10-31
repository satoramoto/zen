import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { fixtureStories, withRenderer } from '../../../stories/story';
import { expectFits, host, withHost } from '../host.story';
import { DicePad, type DicePadProps, type ScaleLock } from './DicePad';
import DicePadSvelte from './DicePad.svelte';
import { dicePadArgTypes, dicePadBoard, dicePadStories as s } from './DicePad.fixtures';

// Every story is built from DicePad.fixtures.ts (`story(s.Name)`); the toolbar's Renderer draws it
// with React's or Svelte's `Tree`. Disabled is the pad with no callbacks: read-only.

/** The happy accidents aimed at the selected track: six moves over their captions, the scale lock, the CHAOS macro. */
const meta = {
  id: 'music-live-dice-pad',
  title: 'Music/Live/Dice pad',
  component: DicePad,
  decorators: [withRenderer, withStoryFrame, withHost, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 320, h: 300 } },
  args: dicePadBoard,
  argTypes: dicePadArgTypes,
} satisfies Meta<typeof DicePad>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(DicePad, DicePadSvelte);
const framed = (st: Story, w: number, h: number): Story => ({ ...st, parameters: { ...st.parameters, frame: { w, h } } });
const live = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => ({
  ...story(fixture, extra),
  args: { ...fixture.args, onDice: fn(), onScaleLock: fn(), onChaos: fn() },
});

/** Aimed at Keys. Each move asks by name (click or Enter); SHAKE names every generator; the lock and the macro ask theirs. */
export const Default: Story = live(s.Default, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: 'Dice → Keys' })).toBeTruthy();
    await userEvent.click(canvas.getByRole('button', { name: 'MUTATE, Keys' }));
    await expect(args.onDice).toHaveBeenLastCalledWith('mutate');
    canvas.getByRole('button', { name: 'RATIO, Keys' }).focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onDice).toHaveBeenLastCalledWith('ratio');
    await userEvent.click(canvas.getByRole('button', { name: 'SHAKE, every generator' }));
    await expect(args.onDice).toHaveBeenLastCalledWith('shake');
    await expect(canvas.getByRole('button', { name: 'ROTATE, Keys' })).toHaveAttribute('title', 'shift patterns 1 step');
    await userEvent.click(canvas.getByRole('radio', { name: 'Scale' }));
    await expect(args.onScaleLock).toHaveBeenCalledWith('scale');
    canvas.getByRole('slider', { name: 'Chaos' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(args.onChaos).toHaveBeenLastCalledWith(expect.closeTo(0.26, 5));
    // Nothing moves until the host says so.
    await expect(canvas.getByRole('radio', { name: 'Chord' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvasElement.querySelector('[data-part="chaos-reading"]')).toHaveTextContent('0.25');
  },
});

/** Two moves the host can't make are disabled and ask nothing; the lock reads off, chaos high. */
export const EveryState: Story = live(s.EveryState, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ['ROTATE, Keys', 'RATIO, Keys']) {
      await expect(canvas.getByRole('button', { name })).toBeDisabled();
      await userEvent.click(canvas.getByRole('button', { name }), { pointerEventsCheck: 0 });
    }
    await expect(args.onDice).not.toHaveBeenCalled();
    await expect(canvas.getByRole('radio', { name: 'Off' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvasElement.querySelector('[data-part="chaos-reading"]')).toHaveTextContent('0.90');
  },
});

/** The `row` form: the ONE board's dice row — MUTATE, KEEP, REVERT, SHAKE and the macro in one line. */
export const Dense: Story = framed(
  live(s.Dense, {
    play: async ({ args, canvasElement }) => {
      const canvas = within(canvasElement);
      const words = canvas.getAllByRole('button').map((b) => b.textContent);
      await expect(words).toEqual(['MUTATE', 'KEEP ✓', 'REVERT ↩', 'SHAKE']);
      await expect(canvas.queryByRole('radio')).toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: 'KEEP, Keys' }));
      await expect(args.onDice).toHaveBeenCalledWith('keep');
      await expectFits(canvasElement);
    },
  }),
  560,
  44,
);

/** No track selected: every aimed move is disabled, SHAKE still asks. */
export const Empty: Story = live(s.Empty, {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('no track selected')).toBeTruthy();
    for (const name of ['MUTATE', 'ROTATE', 'RATIO', 'KEEP', 'REVERT']) await expect(canvas.getByRole('button', { name })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'SHAKE, every generator' }));
    await expect(args.onDice).toHaveBeenCalledWith('shake');
  },
});

/** No callbacks: the dice are disabled, the lock and the macro are readings. */
export const Disabled: Story = story(s.Disabled, {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const button of canvas.getAllByRole('button')) await expect(button).toBeDisabled();
    await expect(canvas.queryByRole('slider')).toBeNull();
    await expect(canvasElement.querySelector('[data-part="lock"]')).toHaveTextContent('lock: chord');
  },
});

/** A host that takes the lock and the macro. The moves are its generators' to run: it changes nothing for them. */
const dice = host<DicePadProps>({ apply: { onScaleLock: (_, scaleLock: ScaleLock) => ({ scaleLock }), onChaos: (_, chaos: number) => ({ chaos }) } });

/** Controlled readback: the lock (click or arrows) and the macro (drag and arrows) read back the host's values; each arrow steps from the host's. */
export const Hosted: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, ...dice },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Scale' }));
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Scale' })).toHaveAttribute('aria-checked', 'true'));
    canvas.getByRole('radio', { name: 'Scale' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(canvas.getByRole('radio', { name: 'Off' })).toHaveAttribute('aria-checked', 'true'));
    const slider = canvas.getByRole('slider', { name: 'Chaos' });
    slider.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(canvasElement.querySelector('[data-part="chaos-reading"]')).toHaveTextContent('0.27'));
    await expect(canvas.getByRole('slider', { name: 'Chaos' })).toHaveFocus();
    await fireEvent.pointerDown(canvas.getByRole('slider', { name: 'Chaos' }), { pointerId: 2, button: 0, clientX: 100, clientY: 10 });
    await fireEvent.pointerMove(canvas.getByRole('slider', { name: 'Chaos' }), { pointerId: 2, clientX: 160, clientY: 10 });
    await fireEvent.pointerUp(canvas.getByRole('slider', { name: 'Chaos' }), { pointerId: 2 });
    await waitFor(() => expect(Number(canvasElement.querySelector('[data-part="chaos-reading"]')!.textContent)).toBeGreaterThan(0.27));
    await expect(Number(canvas.getByRole('slider', { name: 'Chaos' }).getAttribute('aria-valuenow'))).toBeLessThanOrEqual(1);
    await expect(args.onScaleLock).toHaveBeenNthCalledWith(2, 'off');
  },
});

/** Rebinding: the host selects another track. The moves name it, and ask nothing about Keys. */
export const Rebound: Story = live(s.Default, {
  parameters: { ...story(s.Default).parameters, host: { ...dice.host, presets: { 'Select Bass': { target: 'Bass' } } } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Select Bass' }));
    await waitFor(() => expect(canvas.getByRole('group', { name: 'Dice → Bass' })).toBeTruthy());
    await expect(canvas.queryByRole('button', { name: /, Keys$/ })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'MUTATE, Bass' }));
    await expect(args.onDice).toHaveBeenCalledTimes(1);
  },
});
