import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { scenario } from 'story-spec';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { Workspace } from './Workspace';
import WorkspaceSvelte from './Workspace.svelte';
import { workspacePane } from './content.story';
import { useSurfaceHost } from './host.story';
import { MIX_STORE_INTENTS, mixDefaultDocument, mixPanes, mixTargets } from './mix.fixtures';
import { opened, tabOf, workspaceDocument, workspacePanes, workspaceStories as s, workspaceTargets } from './Workspace.fixtures';
import type { SurfaceDocument, SurfaceIntent, SurfaceRegion } from './Workspace.types';

// The document the app owns: the surface draws it as given, never writes it, reads every kind from
// `kind`, and draws what it doesn't know rather than dropping it. The last scenario draws mix[flow]'s
// own rig document, unconverted.

const meta = {
  title: 'Design OS/Layout/Workspace/Document',
  component: Workspace,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 1440, h: 900 },
    spec: {
      capability: 'live-surface-document',
      purpose: 'The document an app owns and the surface draws: its shape, its version, and how the surface treats an id or kind it doesn’t know.',
      requirement: 'The app owns the surface document',
      shall: 'The surface SHALL draw the surface document it is given, a version 1 value of tabs, each tab rows of region instance ids and the instances (each with its own id, a pane kind, a title and a binding), and the open tab’s id, and SHALL never store, save or alter that document itself.',
    },
  },
  args: { name: 'Live', document: workspaceDocument },
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Workspace, WorkspaceSvelte);


/** The region ids drawn, in reading order. */
const drawn = (el: HTMLElement): string[] => [...el.querySelectorAll<HTMLElement>('[data-testid^="pane-"]')].map((p) => p.dataset.testid!.slice(5));

const THREE: SurfaceDocument = { ...workspaceDocument, active: 'grid', tabs: workspaceDocument.tabs.slice(0, 3) };

export const TheSurfaceDrawsTheAppsDocument: Story = scenario(
  {
    name: 'The surface draws the app’s document',
    when: 'an app gives the surface a document with three tabs and opens the second',
    then: 'the tab strip shows the three titles with the second selected and its regions drawn in its rows, in order',
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getAllByRole('tab').map((t) => t.textContent)).toEqual(['My stage', 'Session grid', 'Arp & follow']);
      await expect(canvas.getByRole('tab', { name: 'Session grid' })).toHaveAttribute('aria-selected', 'true');
      await expect(drawn(canvasElement)).toEqual(['grid-1', 'grid-2']);
    },
  },
  { render: () => <Workspace name="Live" document={THREE} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

const OTHER: SurfaceDocument = { version: 2, active: 'jam', tabs: [tabOf('jam', 'Jam', [['stems', 'cuts']])] };

function Swapping() {
  const [doc, setDoc] = useState<SurfaceDocument>(workspaceDocument);
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <button type="button" onClick={() => setDoc(OTHER)}>
        Story: load another document
      </button>
      <Workspace name="Live" document={doc} panes={workspacePanes} pane={workspacePane} />
    </div>
  );
}

export const ANewDocumentReplacesTheOld: Story = scenario(
  {
    name: 'A new document replaces the old',
    when: 'the app gives the surface a different document in place of the first',
    then: 'the surface draws the new tabs and regions and nothing of the old one remains',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Story: load another document' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Jam']));
      await expect(drawn(canvasElement)).toEqual(['jam-1', 'jam-2']);
    },
  },
  { render: () => <Swapping /> },
) as Story;

export const AnEditLeavesTheDocumentAsGivenUntilTheAppAppliesIt: Story = scenario(
  {
    name: 'An edit leaves the document as given until the app applies it',
    when: 'a person removes a region in edit mode and the app does not apply the edit',
    then: 'the region is still drawn where it was',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'remove Loop grid' }));
    },
    check: async ({ canvasElement, args }) => {
      await expect((args.onIntent as ReturnType<typeof fn>).mock.calls.map(([i]) => (i as SurfaceIntent).type)).toEqual(['removeRegion']);
      await expect(canvasElement.querySelector('[data-region="stage-1"][data-part="frame"]')).toBeTruthy();
    },
  },
  story(s.Picked, { args: { ...s.Picked.args, onIntent: fn() } }),
) as Story;

const region = (id: string, kind: string, title: string, binding: SurfaceRegion['binding'] = { mode: 'selected' }): SurfaceRegion => ({ id, kind, title, binding });

const TWO_GRIDS: SurfaceDocument = {
  version: 1,
  active: 'twin',
  tabs: [{ id: 'twin', title: 'Twin grids', rows: [['g1', 'g2']], regions: [region('g1', 'loopGrid', 'Left grid', { mode: 'fixed', target: 'bass' }), region('g2', 'loopGrid', 'Right grid', { mode: 'fixed', target: 'drums' })] }],
};

export const TwoInstancesOfOneKindOnOneTab: Story = scenario(
  {
    requirement: 'Kinds are named, never inferred',
    shall: 'The surface SHALL read each region’s pane kind from the instance’s `kind` alone, never from its id, so that two instances of one kind and instances with any ids draw correctly.',
    name: 'Two instances of one kind on one tab',
    when: 'a tab holds two instances of the same kind, bound to different targets',
    then: 'both are drawn, each with its own title and its own target',
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByTestId('pane-g1')).toHaveAttribute('data-target', 'bass');
      await expect(canvas.getByTestId('pane-g2')).toHaveAttribute('data-target', 'drums');
      await expect(canvas.getByTestId('pane-g1')).toHaveTextContent('Left grid → bass');
      await expect(canvas.getByTestId('pane-g2')).toHaveTextContent('Right grid → drums');
    },
  },
  { render: () => <Workspace name="Live" document={TWO_GRIDS} panes={workspacePanes} selected="keys" pane={workspacePane} /> },
) as Story;

const MISLEADING: SurfaceDocument = { version: 1, active: 't', tabs: [{ id: 't', title: 'T', rows: [['mix-1']], regions: [region('mix-1', 'stems', 'Stems')] }] };

export const AnIdThatLooksLikeAnotherKind: Story = scenario(
  {
    requirement: 'Kinds are named, never inferred',
    shall: 'The surface SHALL read each region’s pane kind from the instance’s `kind` alone, never from its id, so that two instances of one kind and instances with any ids draw correctly.',
    name: 'An id that looks like another kind',
    when: 'an instance whose id is `mix-1` has the kind `stems`',
    then: 'it is drawn as a stems pane',
    check: async ({ canvasElement }) => {
      await expect(within(canvasElement).getByTestId('pane-mix-1')).toHaveAttribute('data-kind', 'stems');
    },
  },
  { render: () => <Workspace name="Live" document={MISLEADING} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

const WITH_UNKNOWN: SurfaceDocument = {
  version: 1,
  active: 't',
  tabs: [{ id: 't', title: 'T', rows: [['a', 'b'], ['c']], regions: [region('a', 'loopGrid', 'Grid'), region('b', 'theremin', 'Theremin'), region('c', 'cuts', 'Cuts')] }],
};

function UnknownHost() {
  const host = useSurfaceHost(WITH_UNKNOWN, { keepEditing: true, editing: true });
  return <Workspace name="Live" document={host.document} panes={workspacePanes} editing={host.editing} onIntent={host.onIntent} pane={workspacePane} />;
}

export const AnUnknownKind: Story = scenario(
  {
    requirement: 'What the surface doesn’t know is drawn, not dropped',
    shall: 'The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode, and SHALL skip a row entry naming an instance the tab doesn’t hold without failing the rest of the tab.',
    name: 'An unknown kind',
    when: 'a document names a kind the app gave no definition for',
    then: 'that region shows a placeholder naming the unknown kind and the rest of the tab draws normally',
    and: ['in edit mode the placeholder can still be moved and removed'],
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('note', { name: 'Theremin: unknown pane theremin' })).toHaveTextContent('Unknown pane “theremin”');
      await expect(drawn(canvasElement)).toEqual(['a', 'c']);
      await userEvent.click(canvas.getByRole('button', { name: 'Theremin tools' }));
      await userEvent.click(canvas.getByRole('button', { name: 'move Theremin down' }));
      // It stepped out of its row: now stacked on its own between the grid and the cuts.
      await waitFor(() => expect(canvasElement.querySelector('[data-leaf="b"]')!.parentElement).toHaveAttribute('data-split', 'column'));
      // Its tools stay open after the move.
      await userEvent.click(canvas.getByRole('button', { name: 'remove Theremin' }));
      await waitFor(() => expect(canvas.queryByRole('note')).toBeNull());
    },
  },
  { render: () => <UnknownHost /> },
) as Story;

const DANGLING: SurfaceDocument = { version: 1, active: 't', tabs: [{ id: 't', title: 'T', rows: [['a', 'ghost', 'c']], regions: [region('a', 'loopGrid', 'Grid'), region('c', 'cuts', 'Cuts')] }] };

export const ADanglingInstanceId: Story = scenario(
  {
    requirement: 'What the surface doesn’t know is drawn, not dropped',
    shall: 'The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode, and SHALL skip a row entry naming an instance the tab doesn’t hold without failing the rest of the tab.',
    name: 'A dangling instance id',
    when: 'a tab’s row names an instance id the tab doesn’t hold',
    then: 'the row draws its other regions and nothing is drawn for the missing one',
    check: async ({ canvasElement }) => {
      await expect(drawn(canvasElement)).toEqual(['a', 'c']);
      await expect(canvasElement.querySelector('[data-region="ghost"]')).toBeNull();
    },
  },
  { render: () => <Workspace name="Live" document={DANGLING} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

export const AnOpenTabIdNoTabHas: Story = scenario(
  {
    requirement: 'What the surface doesn’t know is drawn, not dropped',
    shall: 'The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode, and SHALL skip a row entry naming an instance the tab doesn’t hold without failing the rest of the tab.',
    name: 'An open tab id no tab has',
    when: 'the document’s open tab id matches no tab',
    then: 'the surface shows the first tab',
    check: async ({ canvasElement }) => {
      await expect(within(canvasElement).getByRole('tab', { name: 'My stage' })).toHaveAttribute('aria-selected', 'true');
      await expect(drawn(canvasElement)).toEqual(['stage-1', 'stage-2']);
    },
  },
  { render: () => <Workspace name="Live" document={opened(workspaceDocument, 'nowhere')} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

/** Mix's rig: its own document, kinds and channels, edited through a store stand-in that records every intent. */
function MixRig() {
  const host = useSurfaceHost(mixDefaultDocument(), { titleOf: (kind) => mixPanes.find((p) => p.kind === kind)?.label ?? kind });
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <output aria-label="Story: intents sent">{JSON.stringify(host.intents.map((i) => i.type))}</output>
      <Workspace name="Rig" document={host.document} panes={mixPanes} targets={mixTargets} selected="a" canUndo={host.canUndo} canRedo={host.canRedo} onIntent={host.onIntent} pane={workspacePane} />
    </div>
  );
}

export const MixsDefaultDocument: Story = scenario(
  {
    requirement: 'Mix’s rig documents fit unchanged',
    shall: 'The surface SHALL accept a document in exactly the shape mix’s rig stores (its version 1 surface document and its own region kinds), without conversion.',
    name: 'Mix’s default document',
    when: 'the surface is given a document in mix’s shape with mix’s region kinds and definitions for them',
    then: 'every tab and region of it is drawn, and every edit it offers sends an intent mix’s store has a method for, retitling a region aside',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('tab', { name: 'Hybrid' }));
      await userEvent.click(canvas.getByRole('button', { name: 'edit the views' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Signal tools' }));
      await userEvent.click(canvas.getByRole('button', { name: 'move Signal left' }));
      await userEvent.click(within(canvas.getByRole('radiogroup', { name: 'Bind Signal' })).getByRole('radio', { name: 'Deck B' }));
      await userEvent.click(canvas.getByRole('button', { name: 'open the palette' }));
      await userEvent.click(canvas.getByRole('button', { name: 'add Compass (read-only) beside Signal' }));
      await userEvent.click(canvas.getByRole('button', { name: 'undo' }));
      await userEvent.click(canvas.getByRole('button', { name: 'redo' }));
      await userEvent.click(canvas.getByRole('button', { name: 'duplicate Hybrid' }));
      await userEvent.click(canvas.getByRole('button', { name: 'remove Hybrid copy' }));
      await userEvent.click(canvas.getByRole('button', { name: 'add a view' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Original mix[flow]', 'Session', 'Hybrid', 'View 4']);
      await userEvent.click(canvas.getByRole('tab', { name: 'Hybrid' }));
      await waitFor(() => expect(drawn(canvasElement).length).toBe(7));
      const sent = JSON.parse(canvas.getByLabelText('Story: intents sent').textContent || '[]') as string[];
      await expect(sent.length).toBeGreaterThan(8);
      for (const type of sent) await expect(MIX_STORE_INTENTS).toContain(type);
    },
  },
  { render: () => <MixRig /> },
) as Story;
