import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Layer, Opaque } from '../../layout/Layer';
import { withLibraryTheme } from '../../storybook';
import { DATA, LISTS, MOOD_DECK, PLAYLISTS, row } from '../fixtures/fixtures';
import { VISUALS_GLOBALS, visualsBeforeEach, withVisualsFrame } from '../fixtures/story';
import type { LiveState } from '../model/live-model';
import type * as pl from '../model/playlists';
import { STAGE_CRATE_ID } from '../model/stage-model';
import { say } from '../model/words';
import { StageCrate } from './StageCrate';

/** Live's state as the crate reads it, from the stories' fixtures. */
function liveOf(lists: pl.Lists | null): LiveState {
  return {
    lists,
    setLists: fn(),
    deck: lists?.deck ?? null,
    current: lists?.deck.current ?? null,
    held: false,
    effects: null,
    status: { display: null, size: null },
    displays: null,
    inWindow: false,
    data: DATA,
    key: null,
    star: false,
    rating: null,
    says: { kind: 'held' },
    up: null,
    error: null,
    setError: fn(),
    fail: () => fn(),
    dismiss: fn(),
    act: fn(),
    actFx: fn(),
    show: fn(),
    intensity: 0.5,
    setIntensity: fn(),
    favourite: fn(),
    rate: fn(),
    since: 0,
  };
}

/** Enough playlists that the crate scrolls inside itself. */
const MANY: pl.Lists = {
  ...LISTS,
  playlists: [...PLAYLISTS, ...Array.from({ length: 16 }, (_, i) => ({ ...PLAYLISTS[i % PLAYLISTS.length], id: `copy-${i}`, name: `${PLAYLISTS[i % PLAYLISTS.length].name} ${i + 2}` }))],
};

/**
 * The Stage's crate: Home's inset sidebar, opaque over the full-bleed picture
 * (here the frame's still), down the window's left.
 */
const meta = {
  title: 'open[flow]/visuals/Live/Stage/Crate',
  component: StageCrate,
  args: { live: liveOf(LISTS), mode: 'docked', onAway: fn() },
  decorators: [
    (Story) => (
      <Opaque>
        <div style={{ position: 'relative', width: 760, height: 720, background: 'var(--vs-still) center / cover var(--key-black)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, display: 'flex', width: 256, padding: 8, boxSizing: 'border-box' }}>
            {/* The shell's panel (StageLayout's nav), as it draws it: the band for the window buttons, opaque, rounded. */}
            <Layer
              level="base"
              as="nav"
              id={STAGE_CRATE_ID}
              aria-label={say('crate')}
              style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, paddingTop: 52, borderRadius: 18, overflow: 'hidden', ['--text-3' as string]: 'var(--vs-caption-raised)' }}
            >
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
                <Story />
              </div>
            </Layer>
          </div>
        </div>
      </Opaque>
    ),
    withVisualsFrame,
    withLibraryTheme,
  ],
  globals: VISUALS_GLOBALS,
  beforeEach: visualsBeforeEach,
} satisfies Meta<typeof StageCrate>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Docked beside the picture, Warm-up playing. */
export const Docked: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('navigation', { name: say('crate') })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Warm-up, playing' })).toHaveAttribute('aria-current', 'true');
  },
};

/** A mood playing: its row lit. */
export const MoodPlaying: Story = {
  args: { live: liveOf({ ...LISTS, deck: MOOD_DECK }) },
  parameters: { world: { lists: { ...LISTS, deck: MOOD_DECK }, deckItems: [row(8).path, row(14).path, row(21).path] } },
};

/** The keyboard: one tab stop (the playlist playing), the arrows walk the headings and rows. */
export const Keyboard: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Warm-up, playing' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(canvas.getByRole('button', { name: 'Playlists' })).toHaveFocus();
  },
};

/** More playlists than fit: the sections scroll inside the crate, the mark staying put. */
export const LongLists: Story = {
  args: { live: liveOf(MANY) },
  play: async ({ canvasElement }) => {
    // The crate's own scroller (the Crate's): the element in the panel that scrolls on its own.
    const scroller = [...canvasElement.querySelectorAll<HTMLElement>('.vs-stagecrate *')].find((el) => getComputedStyle(el).overflowY === 'auto');
    await expect(scroller).toBeDefined();
    await expect(scroller!.scrollHeight).toBeGreaterThan(scroller!.clientHeight);
  },
};

/** Before the playlists are in. */
export const Reading: Story = { args: { live: liveOf(null) } };
