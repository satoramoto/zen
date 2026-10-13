import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Opaque } from '../../layout/Layer';
import { withLibraryTheme } from '../../storybook';
import { FX, FX_BUSY, LISTS, MOOD_DECK, WARM_UP } from '../fixtures/fixtures';
import { VISUALS_GLOBALS, visualsBeforeEach, withVisualsFrame } from '../fixtures/story';
import { useLive } from '../model/useLive';
import { StageDock, StageNotices, type StageDockForm } from './StageDock';

/** The window's width the controls are drawn in, and the form they draw (outside an assembled screen, the first unless given). */
interface Args {
  width: number;
  form?: StageDockForm;
}

/**
 * The controls as the Stage places them: under the header's row, 20px in from
 * the sides and 12px over the foot of a window `width` wide, over the frame's
 * still standing in for the native preview, on the stories' fake app through
 * `useLive`, so the keys and the slider really act. The notices are the corner
 * toasts, at the bottom right. (The scrim and the hover fade are the shell's:
 * Live/Stage/Layout.)
 */
function Window({ width, form }: Args) {
  const live = useLive({ start: null });
  return (
    <Opaque>
      <div style={{ position: 'relative', width, height: 420, background: 'var(--vs-still) center / cover var(--key-black)' }}>
        <div style={{ position: 'absolute', top: 60, right: 20, bottom: 12, left: 20, display: 'flex' }}>
          <StageDock live={live} form={form} />
        </div>
        <div style={{ position: 'absolute', right: 16, bottom: 106, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <StageNotices live={live} />
        </div>
      </div>
    </Opaque>
  );
}

/**
 * **The Stage's controls.** Home's transport floating over the picture: the
 * preset playing and where from at the top left, its star at the top right,
 * and at the foot ◀ the auto-change ring ▶ the dice, where a click on the ring
 * is HOLD (its tooltip says when it moves on), and the audio input. Under the
 * keys the effects' row: Strobe and Freeze (held while pressed, Shift latches)
 * and Blackout (a toggle) as quiet keys, their letters in the tooltips;
 * Intensity as an Apple slider row; More effects…. In the stacked form (a
 * narrow window) the keys take a row of their own.
 */
const meta = {
  title: 'open[flow]/visuals/Live/Stage/Dock',
  component: Window,
  decorators: [withVisualsFrame, withLibraryTheme],
  globals: VISUALS_GLOBALS,
  beforeEach: visualsBeforeEach,
  args: { width: 1440 },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Window>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Whether two boxes overlap by more than a hair. */
const overlap = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;

/** Every control in the effects' row, none over another, none past the controls' box. */
async function nothingOverlaps(root: HTMLElement) {
  const dock = root.querySelector('.vs-stagedock')!.getBoundingClientRect();
  const parts = ['.vs-stagedock-keys', '.vs-stagedock-intensity', '.vs-stagedock-more', '.vs-transport-keys'].map((s) => root.querySelector(s)!.getBoundingClientRect());
  for (const [i, a] of parts.entries()) {
    await expect(a.right).toBeLessThanOrEqual(dock.right + 0.5);
    await expect(a.bottom).toBeLessThanOrEqual(dock.bottom + 0.5);
    for (const b of parts.slice(i + 1)) await expect(overlap(a, b)).toBe(false);
  }
}

/** Playing Warm-up: the transport's ring holds and lets go; the keys act; Intensity is a slider row at 50%. */
export const Playing: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByText(WARM_UP.items[2].name)).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Strobe (hold S, ⇧S latches)' })).toBeVisible();
    await expect(canvas.getByRole('slider', { name: 'Intensity' })).toHaveAttribute('aria-valuetext', '50%');
    await expect(canvas.getByRole('button', { name: 'random preset' }).querySelector('[data-icon="dice"]')).not.toBeNull();
    await nothingOverlaps(canvasElement);
    await expect(canvas.getByRole('button', { name: 'move on by itself' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'move on by itself' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'move on by itself' })).toHaveAttribute('aria-pressed', 'false'));
    await userEvent.click(canvas.getByRole('button', { name: 'Blackout (B)' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Blackout (B)' })).toHaveAttribute('aria-pressed', 'true'));
  },
};

/** Narrow (a 600px window), stacked: the keys on a row of their own over Intensity and More effects…. */
export const Narrow: Story = {
  args: { width: 600, form: 'stacked' },
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByRole('button', { name: /^Freeze/ })).toBeVisible();
    await nothingOverlaps(canvasElement);
  },
};

/** Mid-set on a mood: HOLD on (the ring not pressed), the strobe latched. */
export const Busy: Story = {
  parameters: { world: { fx: { ...FX_BUSY, strobe: true }, lists: { ...LISTS, deck: MOOD_DECK } } },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByRole('button', { name: 'move on by itself' })).toHaveAttribute('aria-pressed', 'false'));
    await waitFor(() => expect(canvas.getByRole('button', { name: /^Strobe/ })).toHaveAttribute('aria-pressed', 'true'));
  },
};

/** An effect that won't change: the notice is a corner toast until dismissed. */
export const Failing: Story = {
  parameters: { world: { fx: FX, fail: { act: 'the effects engine is busy' } } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Blackout (B)' }));
    await expect(await canvas.findByRole('alert')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull());
  },
};
