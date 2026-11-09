import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { Workspace, openTab, type ResolvedSettings } from '../../../layout/Workspace/Workspace';
import { useSurfaceHost } from '../../../layout/Workspace/host.story';
import { LIVE_PANES, isLivePaneKind, livePanes } from '../panes';
import { spineTracks } from '../SignalSpine/SignalSpine.fixtures';
import { cutPadsBoard } from '../CutPads/CutPads.fixtures';
import { useLiveSet } from './LiveSet.story';
import { LIVE_DOCUMENT } from './views';

// The live views: the reference DAW built on the surface. The document (views.ts) is the app's: the
// host here keeps it with its undo history and applies every intent the Workspace sends; the panes
// are the Music live set (`livePanes`), each drawn from its instance's kind and the target the
// Workspace resolved. The set is one linked state: select a track anywhere and the grid, the
// strips, the orbits, the spine and the Push follow it. Mine is the point of it: a page built from
// the palette, not designed. React-only: region content is app content.

interface LiveProps {
  /** The tab the story opens on. */
  start: string;
  /** Open in edit mode (the host keeps edit mode, as mix's store does). */
  editing?: boolean;
  running?: boolean;
  /** Show the stand-in for the app's MIDI: a learn switch and four controller CCs. */
  midi?: boolean;
}

/** The story's stand-in for a controller and the app's learn switch: scenario data, not part of zen. */
function MidiStrip({ learning, onLearning, onMove }: { learning: boolean; onLearning: (on: boolean) => void; onMove: (cc: number, value: number) => void }) {
  return (
    <div role="group" aria-label="Story: MIDI stand-in" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-1) var(--space-2)', fontSize: 12 }}>
      <button type="button" aria-pressed={learning} onClick={() => onLearning(!learning)}>
        {learning ? 'Story: learn mode on' : 'Story: learn mode off'}
      </button>
      {[21, 22, 23, 24].map((cc) => (
        <label key={cc} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          CC {cc}
          <input type="range" min={0} max={127} defaultValue={0} aria-label={`Story: controller CC ${cc}`} onInput={(e) => onMove(cc, Number((e.target as HTMLInputElement).value) / 127)} />
        </label>
      ))}
    </div>
  );
}

/** What a region can follow or pick: the set's tracks, and its cuts. */
export const LIVE_TARGETS = [...spineTracks.map((t) => ({ id: t.id, label: t.name, kind: 'track' })), ...cutPadsBoard.map((p) => ({ id: p.id, label: p.label, kind: 'cut' }))];

function Live({ start, editing = false, running = true, midi = false }: LiveProps) {
  const host = useSurfaceHost({ ...LIVE_DOCUMENT, active: start }, { keepEditing: true, editing, titleOf: (kind) => (isLivePaneKind(kind) ? LIVE_PANES[kind].label : kind) });
  const live = useLiveSet({ running });
  const configure = (region: string) => (settings: ResolvedSettings) => host.onIntent({ type: 'configureRegion', tab: openTab(host.document)!.id, region, settings });
  const surface = (
    <Workspace
      name="Hidden Signals"
      document={host.document}
      panes={livePanes}
      targets={LIVE_TARGETS}
      selected={live.selected}
      canUndo={host.canUndo}
      canRedo={host.canRedo}
      editing={host.editing}
      onIntent={host.onIntent}
      pane={(region, target, settings) => live.content(region, target, settings, configure(region.id))}
    />
  );
  if (!midi) return surface;
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto minmax(0, 1fr)', height: '100%' }}>
      <MidiStrip learning={live.learning} onLearning={live.setLearning} onMove={live.midi} />
      {surface}
    </div>
  );
}

const meta = {
  title: 'Music/Live/Views',
  component: Live,
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: { layout: 'fullscreen', frame: { w: 1440, h: 900 } },
  argTypes: {
    start: { control: 'select', options: LIVE_DOCUMENT.tabs.map((t) => t.id) },
    editing: { control: 'boolean' },
    running: { control: 'boolean' },
    midi: { control: 'boolean' },
  },
} satisfies Meta<typeof Live>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Looper: the performance board, built only through the builder's intents (views.ts) and locked
 * for the gig. The song now along the top; the launch grid on four tracks, the cuts and throws
 * stacked at its right; the four strips under them; the rig's line last. Hold Locked to unlock it.
 */
export const Looper: Story = {
  args: { start: 'looper' },
  parameters: { frame: { w: 1280, h: 800 } },
};

/**
 * The board learning a controller: learn mode on, press the Filter, move CC 21: the Filter is mapped
 * to it and shows its mark; moving CC 21 again rides the Filter. The board stays locked: learning
 * is playing, not building.
 */
export const LooperLearn: Story = {
  name: 'Looper · learn',
  args: { start: 'looper', midi: true },
  parameters: { frame: { w: 1280, h: 840 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Story: learn mode off' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'learn Filter' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Filter: waiting for a control' })).toBeTruthy());
    const cc21 = canvas.getByLabelText('Story: controller CC 21');
    await fireEvent.input(cc21, { target: { value: '30' } });
    await waitFor(() => expect(within(canvasElement.querySelector<HTMLElement>('[data-cell="m1"]')!).getByText('CC 21')).toBeTruthy());
    await userEvent.click(canvas.getByRole('button', { name: 'Story: learn mode on' }));
    // Learn off: the controller now rides the Filter.
    const filter = () => canvasElement.querySelector<HTMLElement>('[data-cell="m1"]')!.textContent ?? '';
    const before = filter();
    await fireEvent.input(cc21, { target: { value: '127' } });
    await waitFor(() => expect(filter()).not.toBe(before));
    await expect(filter()).toMatch(/20\.00\s*kHz/);
    await expect(canvas.getByRole('button', { name: 'unlock Looper' })).toBeTruthy();
  },
};

/** The board retuned between songs: unlocked by a hold, its grid widened, the cuts docked under the throws, Vox dropped from the strips, locked again. */
export const LooperRetuned: Story = {
  name: 'Looper · retuned',
  args: { start: 'looper' },
  parameters: { frame: { w: 1280, h: 800 } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const leaf = (kind: string) => canvasElement.querySelector<HTMLElement>(`[data-leaf] [data-kind="${kind}"]`)?.closest<HTMLElement>('[data-leaf]') ?? null;
    // A brief press leaves it locked; a hold unlocks it.
    const unlock = canvas.getByRole('button', { name: 'unlock Looper' });
    await fireEvent.pointerDown(unlock, { pointerId: 3, button: 0, clientX: 1, clientY: 1 });
    await new Promise((r) => setTimeout(r, 450));
    await fireEvent.pointerUp(window, { pointerId: 3, clientX: 1, clientY: 1 });
    await userEvent.click(await canvas.findByRole('button', { name: 'edit the views' }));
    // Widen the grid against the cuts and throws.
    const handle = await canvas.findByRole('separator', { name: 'Resize Launch grid and Cut pads' });
    const before = leaf('loop')!.getBoundingClientRect().width;
    handle.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await waitFor(() => expect(leaf('loop')!.getBoundingClientRect().width).toBeGreaterThan(before + 20));
    // Dock the cuts under the throws.
    const grip = leaf('cuts')!.querySelector<HTMLElement>('[data-part="grip"]')!;
    const throws = leaf('throws')!.getBoundingClientRect();
    const g = grip.getBoundingClientRect();
    await fireEvent.pointerDown(grip, { pointerId: 4, button: 0, clientX: g.left + 8, clientY: g.top + 8 });
    for (const f of [0.25, 0.5, 0.75, 1]) await fireEvent.pointerMove(grip, { pointerId: 4, clientX: g.left + 8 + (throws.left + throws.width / 2 - g.left - 8) * f, clientY: g.top + 8 + (throws.bottom - 6 - g.top - 8) * f });
    await fireEvent.pointerUp(grip, { pointerId: 4 });
    await waitFor(() => expect(leaf('cuts')!.getBoundingClientRect().top).toBeGreaterThan(leaf('throws')!.getBoundingClientRect().top));
    // Drop Vox from the strips.
    await userEvent.click(canvas.getByRole('button', { name: 'Track strips tools' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Track strips settings' }));
    await userEvent.click(within(canvas.getByRole('group', { name: 'Tracks' })).getByRole('checkbox', { name: 'Vox' }));
    await waitFor(() => expect([...canvasElement.querySelectorAll<HTMLElement>('.live-track-strips [data-track]')].map((s) => s.dataset.track)).toEqual(['drums', 'bass', 'keys']));
    // Locked again for the next song.
    await userEvent.click(canvas.getByRole('button', { name: 'lock Looper' }));
    await waitFor(() => expect(canvas.getByRole('button', { name: 'unlock Looper' })).toBeTruthy());
    await expect(canvasElement.querySelectorAll('[data-part="handle"]')).toHaveLength(0);
  },
};

/**
 * ONE: the unified board. The night along the top (tempo contour, the song now open into its
 * scenes, Wire cued), the launch grid beside the compass, the song's sections beside the landing
 * countdown, the track strips beside the stem deck, the rig's one line last.
 */
export const One: Story = {
  name: 'ONE',
  args: { start: 'one' },
  play: async ({ canvasElement }) => {
    // Select Bass in the grid's header: the strips follow.
    await userEvent.click(within(canvasElement.querySelector<HTMLElement>('.live-launch-grid')!).getByRole('button', { name: 'Select Bass' }));
    await waitFor(() => expect(canvasElement.querySelector('.live-track-strips [data-selected="true"]')).toHaveAccessibleName(/Bass/));
    // A section press queues it; a stem toggle mutes it.
    const sections = within(canvasElement.querySelector<HTMLElement>('.live-sections')!);
    await userEvent.click(sections.getByRole('button', { name: /^Section BRIDGE/ }));
    await waitFor(() => expect(sections.getByRole('button', { name: /^Section BRIDGE, queued/ })).toBeTruthy());
    // The song card's JAM goes free; the dice aim at the selected track.
    const song = within(canvasElement.querySelector<HTMLElement>('.live-song')!);
    await userEvent.click(song.getByRole('button', { name: 'Jam from here' }));
    await waitFor(() => expect(song.getByRole('button', { name: 'Jam, playing' })).toHaveAttribute('aria-pressed', 'true'));
    await expect(canvasElement.querySelector('.live-dice')).toHaveAccessibleName('Dice → Bass');
    const stems = canvasElement.querySelector<HTMLElement>('.live-stems')!;
    const toggle = within(stems).getAllByRole('button').find((b) => /Bass/.test(b.getAttribute('aria-label') ?? ''))!;
    const was = toggle.getAttribute('aria-pressed');
    await userEvent.click(toggle);
    await waitFor(() => expect(within(stems).getAllByRole('button').find((b) => /Bass/.test(b.getAttribute('aria-label') ?? ''))).not.toHaveAttribute('aria-pressed', was!));
  },
};

/** Follow: the harmony as a place (compass), in time (orbits), and as the loop that plays it. */
export const Follow: Story = {
  args: { start: 'follow' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getAllByRole('button', { name: /^Drums/ })[0]);
    await waitFor(() => expect(canvas.getAllByRole('button', { pressed: true, name: /Drums/ }).length).toBeGreaterThan(0));
  },
};

/** Track: one column as its signal path — the looper's layers as tree rings — with throws and cuts under it. */
export const Track: Story = {
  args: { start: 'track' },
  play: async ({ canvasElement }) => {
    const spine = within(canvasElement.querySelector<HTMLElement>('.live-spine')!);
    await userEvent.click(spine.getByRole('button', { name: /next track/i }));
    await waitFor(() => expect(spine.getAllByText('Vox').length).toBeGreaterThan(0));
  },
};

/** Hands: the Push twin beside the landing and the orbits — what's under the player's hands. */
export const Hands: Story = {
  args: { start: 'hands' },
};

/**
 * Mine: build a page. Edit mode with every live pane in the palette: add panes, move them, bind
 * the dice or the spine to a track, undo what you didn't mean. Every edit is an intent the host
 * applies; the solver re-picks every pane's form, so the page still fits and still re-themes.
 */
export const Mine: Story = {
  name: 'Mine (build your own)',
  args: { start: 'mine', editing: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'open the palette' }));
    for (const label of ['Chord compass', 'Sections', 'Stem deck', 'Dice pad']) {
      await userEvent.click(canvas.getByRole('button', { name: `add ${label} to this tab` }));
    }
    await waitFor(() => expect(canvasElement.querySelector('.live-dice')).toBeTruthy());
    for (const part of ['.live-compass', '.live-sections', '.live-stems']) await expect(canvasElement.querySelector(part)).toBeTruthy();
    // Bind the dice to Drums: it aims there whatever is selected.
    await userEvent.click(canvas.getByRole('button', { name: 'Dice pad tools' }));
    await userEvent.click(within(canvas.getByRole('radiogroup', { name: 'Bind Dice pad' })).getByRole('radio', { name: 'Drums' }));
    await waitFor(() => expect(canvasElement.querySelector('.live-dice')).toHaveAccessibleName('Dice → Drums'));
    // The host's history: undo takes the binding back.
    await userEvent.click(canvas.getByRole('button', { name: 'undo' }));
    await waitFor(() => expect(canvasElement.querySelector('.live-dice')).not.toHaveAccessibleName('Dice → Drums'));
  },
};

/** ONE, held still: the clock stopped, for screenshots and theme reads. */
export const OneStill: Story = {
  name: 'ONE · still',
  args: { start: 'one', running: false },
};
