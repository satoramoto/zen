import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { Lights } from '../HomeLayout/HomeLayout';
import { FX_BUSY, LISTS, PLAYING_DECK, WARM_UP } from '../fixtures/fixtures';
import { VISUALS_GLOBALS, visualsBeforeEach, withVisualsFrame } from '../fixtures/story';
import { Live } from './Live';

/**
 * Live mode, whole, as `App` shows it: the Stage — the picture full-bleed,
 * and over it, on hover, the header's bare type along the top and Home's
 * floating transport with the effects' row under it. No sidebar, no dock bar.
 * It plays in the window on the way in, "Go full screen on…" a toast in the
 * corner until a display is picked (only a start in live mode, `windowed`
 * false, opens the output by itself). `\` pins the controls shown; ? lists
 * every control. The parts have stories of their own (Live/Stage…).
 */
/**
 * The fluid window (`parameters.frame: 'fill'`): the Stage fills the canvas at its real size, as
 * the app fills its window.
 */
const WINDOW = 'fill' as const;

/** The window buttons' stand-in over the Stage (the real ones are macOS's), so the header's room beside them can be judged. */
const withLights: Decorator = (Story) => (
  <div style={{ position: 'relative', height: '100%' }}>
    <Story />
    <Lights />
  </div>
);

const meta = {
  title: 'open[flow]/visuals/Live/Live',
  component: Live,
  decorators: [withLights, withVisualsFrame, withStoryFrame, withLibraryTheme],
  globals: VISUALS_GLOBALS,
  beforeEach: visualsBeforeEach,
  args: { start: null, onMode: () => {} },
  parameters: { scope: 'bare', layout: 'fullscreen', frame: WINDOW },
} satisfies Meta<typeof Live>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Live's root: what it is doing, as data (it takes no box of its own). */
const root = (el: HTMLElement) => el.querySelector<HTMLElement>('.vs-live')!;
/** The one overlay over the picture (the header and the controls), and whether it shows. */
const reveal = (el: HTMLElement) => el.querySelector<HTMLElement>('.vs-stagelayout-reveal')!;
const shows = (el: HTMLElement) => waitFor(() => expect(getComputedStyle(reveal(el)).opacity).toBe('1'));

/**
 * Playing Warm-up with Link on (two peers, 124 BPM), the output put on the projector from the
 * corner toast; focus in the controls shows them (as hovering the window does); `\` pins them
 * shown and lets them go.
 */
export const Playing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(root(canvasElement)).toBeInTheDocument());
    // No sidebar in live.
    await expect(canvasElement.querySelector('nav')).toBeNull();
    // Going live plays in the window, with two displays too, until one is picked: the offer is a corner toast.
    await waitFor(() => expect(root(canvasElement).dataset.windowed).toBe(''));
    const go = await canvas.findByRole('button', { name: 'Go full screen on Projector (HDMI)' });
    await expect(go.closest('.vs-stagelayout-toasts')).not.toBeNull();
    await userEvent.click(go);
    await waitFor(() => expect(root(canvasElement).dataset.windowed).toBeUndefined());
    // The controls show while focus is in them.
    canvas.getByRole('button', { name: 'next preset' }).focus();
    await shows(canvasElement);
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.keyboard('\\');
    await waitFor(() => expect(root(canvasElement).dataset.pinned).toBe(''));
    await shows(canvasElement);
    await userEvent.keyboard('\\');
    await waitFor(() => expect(root(canvasElement).dataset.pinned).toBeUndefined());
  },
};

/** Pinned shown (`\`) at 1440 × 900, to judge the overlay's look. */
export const PinnedWide: Story = {
  name: 'Pinned, 1440 × 900',
  parameters: { frame: { w: 1440, h: 900 } },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(root(canvasElement)).toBeInTheDocument());
    await userEvent.keyboard('\\');
    await shows(canvasElement);
  },
};

/** Pinned shown at 1000 × 700. */
export const PinnedNarrow: Story = {
  name: 'Pinned, 1000 × 700',
  parameters: { frame: { w: 1000, h: 700 } },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(root(canvasElement)).toBeInTheDocument());
    await userEvent.keyboard('\\');
    await shows(canvasElement);
  },
};

/** Mid-set: HOLD on, speed up, the mirror and trails on. */
export const Busy: Story = {
  parameters: { world: { fx: FX_BUSY, lists: { ...LISTS, deck: { ...PLAYING_DECK, hold: true } } } },
};

/** One display: played in the window, the toast offering to cover it with the picture. */
export const OneDisplay: Story = {
  parameters: { world: { displays: [{ id: 1, index: 0, name: 'Built-in Retina Display', width: 3024, height: 1964, main: true }] } },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(root(canvasElement).dataset.windowed).toBe(''));
    await expect(await within(canvasElement).findByRole('button', { name: 'Go full screen on Built-in Retina Display' })).toBeVisible();
  },
};

/** Started in live mode (`VISUALS_LIVE=1`): the one way in that opens the output by itself, on the projector. */
export const StartedLive: Story = {
  args: { windowed: false },
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(root(canvasElement).dataset.windowed).toBeUndefined());
  },
};

/** Nothing playing yet and no playlist: live picks one at random. */
export const FromNothing: Story = {
  parameters: { world: { lists: { playlists: [WARM_UP], deck: { ...PLAYING_DECK, playlist: null, index: null, current: null, next: null, next_index: null, count: 0, settings: null } } } },
};
