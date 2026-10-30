import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../storybook';
import { Workspace } from '../layout/Workspace/Workspace';
import { workspaceRegionIds } from '../layout/Workspace/Workspace.edit';
import type { WorkspaceBinding, WorkspaceTab } from '../layout/Workspace/Workspace.types';
import { useLiveSet } from './LiveSet.story';
import { SET_TRACKS } from './set';
import { CONCEPT_TABS, PANE_PALETTE } from './views';
import './live.css';

// The concept views: one live set as Lemur pages. Each tab is a ScreenSpec of panes — the new
// concept panes (Live/Panes) beside the live widgets — and the solver picks every pane's form.
// The set is one linked state: pick a track on the orbits and the spine, the Push column and the
// grid follow it; pick a wedge on the compass and the orbits follow that chord. The Mine tab is
// the point of it all: edit mode with every pane kind in the palette, so a page is built, not
// designed. React-only: region content is app content.

interface ConceptProps {
  /** The tab the story opens on. */
  start: string;
  editing?: boolean;
  running?: boolean;
}

/** The app's side of the Workspace: it keeps the tabs, the open tab and the bindings, and fills every region. */
function Concepts({ start, editing = false, running = true }: ConceptProps) {
  const [tabs, setTabs] = useState<readonly WorkspaceTab[]>(CONCEPT_TABS);
  const [active, setActive] = useState(start);
  const [bindings, setBindings] = useState<Record<string, WorkspaceBinding>>({});
  const live = useLiveSet({ running, bindings });
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  const content: Record<string, ReactNode> = {};
  for (const id of workspaceRegionIds(tab.spec)) content[id] = live.content(id, bindings);

  return (
    <Workspace
      name="Hidden Signals"
      workspace={{ tabs, start }}
      active={tab.id}
      editing={editing}
      palette={PANE_PALETTE}
      tracks={SET_TRACKS.map((t) => ({ id: t.id, label: t.name }))}
      bindings={bindings}
      content={content}
      onTab={setActive}
      onSpec={(id, next) => setTabs((all) => all.map((t) => (t.id === id ? { ...t, spec: next } : t)))}
      onBinding={(_, region, binding) => setBindings((b) => ({ ...b, [region]: binding }))}
    />
  );
}

const meta = {
  title: 'Live/Views',
  component: Concepts,
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: { layout: 'fullscreen', frame: { w: 1440, h: 900 } },
  argTypes: {
    start: { control: 'select', options: CONCEPT_TABS.map((t) => t.id) },
    editing: { control: 'boolean' },
    running: { control: 'boolean' },
  },
} satisfies Meta<typeof Concepts>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ONE: the unified board. The night along the top (tempo contour, the song now open into its
 * scenes, Wire cued), the clips beside the compass and the landing countdown, the mix underneath,
 * the rig's one line on the floor.
 */
export const One: Story = {
  name: 'ONE',
  args: { start: 'one' },
};

/** Follow: the harmony as a place (compass), in time (orbits), and as the loop that plays it. */
export const Follow: Story = {
  args: { start: 'follow' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Pick Drums on the orbits' list: the ring and the list item are pressed together.
    await userEvent.click(canvas.getAllByRole('button', { name: /^Drums/ })[0]);
    await waitFor(() => expect(canvas.getAllByRole('button', { pressed: true, name: /Drums/ }).length).toBeGreaterThan(0));
  },
};

/** Track: one column as its signal path — the looper's layers as tree rings — with throws and cuts under it. */
export const Track: Story = {
  args: { start: 'track' },
  play: async ({ canvasElement }) => {
    // Keys is selected; the spine's next arrow moves it to Vox.
    const bar = within(canvasElement.querySelector<HTMLElement>('.lv-spine__bar')!);
    await userEvent.click(bar.getByRole('button', { name: 'Next track' }));
    await waitFor(() => expect(bar.getByText('Vox')).toBeTruthy());
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
    await waitFor(() => expect(canvas.getByRole('img', { name: /Circle of fifths/ })).toBeTruthy());
  },
};

/** ONE, held still: the clock stopped, for screenshots and theme reads. */
export const OneStill: Story = {
  name: 'ONE · still',
  args: { start: 'one', running: false },
};
