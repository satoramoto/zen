import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { VISUALS_GLOBALS, visualsBeforeEach, withVisualsFrame } from '../fixtures/story';
import { PLAYING_DECK, row, WARM_UP } from '../fixtures/fixtures';
import { INSPECTOR_ID, SIDEBAR_ID } from '../HomeLayout/HomeLayout';
import { Home } from './Home';

/** The preset the deck plays: Warm-up's third, `row(7)`. */
const PLAYING = row(7);

/**
 * The original's `.storybook/preview.tsx` viewports, as design windows (`parameters.frame`): the
 * width the home is built around, the one where it turns narrow, and the narrowest it goes. Each
 * story is drawn at its window and scaled to the canvas (storybook.tsx's `withStoryFrame`).
 */
const WINDOWS = {
  narrow: { w: 560, h: 800 },
  home900: { w: 900, h: 800 },
  home1440: { w: 1440, h: 900 },
};

/**
 * The hero is the picture alone (decision 71); the inspector, where it shows, names the deck's
 * preset, not one picked at random. (The original looked for `.hero-info` and `.insp-name`; the
 * port asks the inspector's panel, by its id, for the name.)
 */
const heroNamesPlaying = async (canvasElement: HTMLElement) => {
  const inspector = canvasElement.querySelector(`#${INSPECTOR_ID}`);
  if (inspector) await waitFor(() => expect(inspector.textContent).toContain(PLAYING.title));
};

/**
 * The whole home as an inspector view (decision 70): the sidebar picking a
 * source, the Now Playing hero over a grid of the source's presets, the
 * inspector about what is picked (else the source), and the transport bar,
 * playing from Warm-up. The sidebar docks from 900 px and the inspector from
 * 1200 px; narrower, each is laid over the grid when opened.
 */
const meta = {
  title: 'open[flow]/visuals/Home/Home',
  component: Home,
  decorators: [withVisualsFrame, withStoryFrame, withLibraryTheme],
  globals: VISUALS_GLOBALS,
  beforeEach: visualsBeforeEach,
  // The window buttons' stand-in, so the title's and the header's room beside them can be judged.
  args: { start: null, onMode: () => {}, lights: true },
  // Picked up where the app left off, as at a launch: without a resume the home opens a random preset, and the hero wouldn't name the deck's.
  parameters: {
    scope: 'bare',
    layout: 'fullscreen',
    frame: WINDOWS.home1440,
    world: { resume: { playlist: WARM_UP.id, index: PLAYING_DECK.index, current: PLAYING_DECK.current, source: null } },
  },
} satisfies Meta<typeof Home>;
export default meta;
type Story = StoryObj<typeof meta>;

/** At 1440×900: Warm-up's grid, the sidebar and the inspector docked. */
export const Wide: Story = {
  parameters: { frame: WINDOWS.home1440 },
  play: async ({ canvas, canvasElement }) => {
    const list = await canvas.findByRole('list', { name: `${WARM_UP.name}, in the order it plays` });
    await heroNamesPlaying(canvasElement);
    // The tiles carry their names; their place is said, not shown: the order is the order.
    const first = (await within(list).findAllByRole('listitem'))[0];
    await expect(first.getAttribute('aria-label')).toMatch(/^1\. /);
    await expect(first.querySelector('.vs-home-tile-n')).toBeNull();
  },
};

/** At 900×800: the sidebar docked, the inspector closed at first. */
export const At900: Story = {
  name: 'At 900 px',
  parameters: { frame: WINDOWS.home900 },
  play: async ({ canvas, canvasElement }) => {
    await expect(await canvas.findByRole('list', { name: `${WARM_UP.name}, in the order it plays` })).toBeTruthy();
    await heroNamesPlaying(canvasElement);
  },
};

/** Under 900 px: both panes put away, opened over the grid from the header. */
export const Narrow: Story = {
  parameters: { frame: WINDOWS.narrow },
};

/** Opened on the library (`VISUALS_VIEW=library`) while Warm-up plays, with a preset picked (⌘-click; a plain click plays): the inspector shows it. */
export const Library: Story = {
  args: { library: true },
  parameters: { frame: WINDOWS.home1440 },
  play: async ({ canvas, canvasElement }) => {
    const grid = await canvas.findByRole('listbox', { name: 'presets' });
    const first = (await within(grid).findAllByRole('option'))[0];
    fireEvent.click(first, { metaKey: true });
    await waitFor(() => expect(first.getAttribute('aria-selected')).toBe('true'));
    // The library's search and "Filter ▾" sit in the header's toolbar slot.
    await expect(canvasElement.querySelector('.vs-header .vs-home-toolbar input')).toBeTruthy();
  },
};

/** Quick add on Warm-up (its card's "Add presets", from its row picked again): the library with the strip over it, ✓ on what Warm-up holds. */
export const QuickAdd: Story = {
  name: 'Quick add',
  parameters: { frame: WINDOWS.home1440 },
  play: async ({ canvas, canvasElement }) => {
    await canvas.findByRole('list', { name: `${WARM_UP.name}, in the order it plays` });
    // In a narrow frame the sidebar and the inspector start put away: open them from the header.
    if (!canvasElement.querySelector(`#${SIDEBAR_ID}`)) await userEvent.click(canvas.getByRole('button', { name: 'sidebar' }));
    const side = within(canvasElement.querySelector(`#${SIDEBAR_ID}`) as HTMLElement);
    // The row itself, not its menu's button (which names the playlist too).
    const row = (await side.findAllByRole('button', { name: new RegExp(`^${WARM_UP.name}`) })).find((b) => !b.hasAttribute('aria-haspopup'))!;
    await userEvent.click(row);
    if (!canvasElement.querySelector(`#${INSPECTOR_ID}`)) await userEvent.click(canvas.getByRole('button', { name: 'info' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Add presets' }));
    await waitFor(() => expect(canvasElement.querySelector('.vs-home-quickadd')?.textContent).toContain(WARM_UP.name));
    await waitFor(() => expect(within(canvas.getByRole('listbox', { name: 'presets' })).getAllByRole('option').some((o) => o.hasAttribute('data-added'))).toBe(true));
  },
};
