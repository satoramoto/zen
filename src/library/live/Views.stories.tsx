import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../storybook';
import { Workspace } from '../layout/Workspace/Workspace';
import { useSurfaceHost } from '../layout/Workspace/host.story';
import { LIVE_PANES, isLivePaneKind, livePanes } from '../Music/live/panes';
import { spineTracks } from '../Music/live/SignalSpine/SignalSpine.fixtures';
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
}

const TARGETS = spineTracks.map((t) => ({ id: t.id, label: t.name, kind: 'track' }));

function Live({ start, editing = false, running = true }: LiveProps) {
  const host = useSurfaceHost({ ...LIVE_DOCUMENT, active: start }, { keepEditing: true, editing, titleOf: (kind) => (isLivePaneKind(kind) ? LIVE_PANES[kind].label : kind) });
  const live = useLiveSet({ running });
  return (
    <Workspace
      name="Hidden Signals"
      document={host.document}
      panes={livePanes}
      targets={TARGETS}
      selected={live.selected}
      canUndo={host.canUndo}
      canRedo={host.canRedo}
      editing={host.editing}
      onIntent={host.onIntent}
      pane={(region, target) => live.content(region, target)}
    />
  );
}

const meta = {
  title: 'Live/Views',
  component: Live,
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: { layout: 'fullscreen', frame: { w: 1440, h: 900 } },
  argTypes: {
    start: { control: 'select', options: LIVE_DOCUMENT.tabs.map((t) => t.id) },
    editing: { control: 'boolean' },
    running: { control: 'boolean' },
  },
} satisfies Meta<typeof Live>;

export default meta;
type Story = StoryObj<typeof meta>;

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
