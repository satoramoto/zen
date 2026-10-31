import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../storybook';
import { Workspace } from '../layout/Workspace/Workspace';
import { workspaceRegionIds } from '../layout/Workspace/Workspace.edit';
import type { WorkspaceBinding } from '../layout/Workspace/Workspace.types';
import type { ScreenSpec } from '../layout/assembly/types';
import { spineTracks } from '../Music/live/SignalSpine/SignalSpine.fixtures';
import { useLiveSet } from './LiveSet.story';
import { LIVE_DOCUMENT, PANE_KINDS, PANE_PALETTE, isPaneKind, liveScreen, type LiveRegion } from './views';

// The live views: one set as Lemur pages. Each tab is a document of region instances (views.ts, in
// mix's surface-document shape), each naming its Music-family live pane and its binding; the solver
// picks every pane's form. The set is
// one linked state: select a track anywhere and the grid, the strips, the orbits, the spine and the
// Push follow it; pick a compass wedge and the orbits follow that chord. Mine is the point of it:
// edit mode with every pane kind in the palette, so a page is built, not designed. React-only:
// region content is app content.

interface LiveProps {
  /** The tab the story opens on. */
  start: string;
  editing?: boolean;
  running?: boolean;
}

/** A tab as the app holds it: the layout the Workspace edits, and the region instances it places. */
interface HeldTab {
  id: string;
  title: string;
  spec: ScreenSpec;
  regions: readonly LiveRegion[];
}

const HELD: readonly HeldTab[] = LIVE_DOCUMENT.tabs.map((t) => ({ id: t.id, title: t.title, spec: liveScreen(t), regions: t.regions }));

/**
 * The app's side of the Workspace: it keeps the tabs, the open tab and every region instance, and
 * fills each region from its instance's kind and binding. An add or a split records the instance
 * the Workspace says it placed, with its kind; a removed region's instance goes with it.
 */
function Live({ start, editing = false, running = true }: LiveProps) {
  const [tabs, setTabs] = useState<readonly HeldTab[]>(HELD);
  const [active, setActive] = useState(start);
  const live = useLiveSet({ running });
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  const content: Record<string, ReactNode> = {};
  for (const region of tab.regions) content[region.id] = live.content(region);
  const bindings: Record<string, WorkspaceBinding> = {};
  for (const region of tab.regions) if (region.binding.mode === 'fixed') bindings[region.id] = { track: region.binding.target };
  const update = (id: string, change: (t: HeldTab) => HeldTab) => setTabs((all) => all.map((t) => (t.id === id ? change(t) : t)));

  return (
    <Workspace
      name="Hidden Signals"
      workspace={{ tabs: tabs.map(({ id, title, spec }) => ({ id, title, spec })), start }}
      active={tab.id}
      editing={editing}
      palette={PANE_PALETTE}
      tracks={spineTracks.map((t) => ({ id: t.id, label: t.name }))}
      bindings={bindings}
      content={content}
      onTab={setActive}
      onSpec={(id, next, _why, placed) =>
        update(id, (t) => {
          const present = new Set(workspaceRegionIds(next));
          const added: LiveRegion[] =
            placed && isPaneKind(placed.kind) ? [{ id: placed.id, kind: placed.kind, title: PANE_KINDS[placed.kind].label, binding: { mode: 'selected' } }] : [];
          return { ...t, spec: next, regions: [...t.regions, ...added].filter((r) => present.has(r.id)) };
        })
      }
      onBinding={(id, region, binding) =>
        update(id, (t) => ({ ...t, regions: t.regions.map((r) => (r.id === region && binding.track ? { ...r, binding: { mode: 'fixed', target: binding.track } } : r)) }))
      }
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
    const canvas = within(canvasElement);
    // Select Bass in the grid's header: the strips follow.
    await userEvent.click(canvas.getAllByRole('button', { name: /^Bass/ })[0]);
    await waitFor(() => expect(canvasElement.querySelector('.live-track-strips [data-selected="true"]')).toBeTruthy());
    // The new parts sit in the same set: a section press queues it; a stem toggle mutes it.
    const sections = within(canvasElement.querySelector<HTMLElement>('.live-sections')!);
    await userEvent.click(sections.getByRole('button', { name: /^Section BRIDGE/ }));
    await waitFor(() => expect(sections.getByRole('button', { name: /^Section BRIDGE, queued/ })).toBeTruthy());
    const stems = canvasElement.querySelector<HTMLElement>('.live-stems')!;
    await expect(stems).toBeTruthy();
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
    // Pick the Drums ring: its ring and its list row read pressed.
    await userEvent.click(canvas.getAllByRole('button', { name: /^Drums/ })[0]);
    await waitFor(() => expect(canvas.getAllByRole('button', { pressed: true, name: /Drums/ }).length).toBeGreaterThan(0));
  },
};

/** Track: one column as its signal path — the looper's layers as tree rings — with throws and cuts under it. */
export const Track: Story = {
  args: { start: 'track' },
  play: async ({ canvasElement }) => {
    // Keys is selected; the spine's next arrow moves it to Vox.
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
 * Mine: build a page. Edit mode with every pane kind in the palette: add one to the last row,
 * split a pane with another, move them, bind a spine or an orbit to a track. Every edit is a new
 * ScreenSpec; the solver re-picks every pane's form, so the page still fits and still re-themes.
 */
export const Mine: Story = {
  name: 'Mine (build your own)',
  args: { start: 'mine', editing: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'add Chord compass to this tab' }));
    await waitFor(() => expect(canvasElement.querySelector('.live-compass')).toBeTruthy());
    // The new parts come from the same palette: the Workspace names each instance it places, with its kind.
    await userEvent.click(canvas.getByRole('button', { name: 'add Sections to this tab' }));
    await waitFor(() => expect(canvasElement.querySelector('.live-sections')).toBeTruthy());
    await userEvent.click(canvas.getByRole('button', { name: 'add Stem deck to this tab' }));
    await waitFor(() => expect(canvasElement.querySelector('.live-stems')).toBeTruthy());
  },
};

/** ONE, held still: the clock stopped, for screenshots and theme reads. */
export const OneStill: Story = {
  name: 'ONE · still',
  args: { start: 'one', running: false },
};
