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
import { applySurfaceIntent, checkDocument, readDocument, splits } from './surface';
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
      shall: 'The surface SHALL draw the surface document it is given, a version 2 value of tabs, each tab a layout tree of splits and region instance ids, the instances (each with its own id, a pane kind, a title, a binding and its settings) and whether the tab is locked, and the open tab’s id, and SHALL never store, save or alter that document itself.',
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
    then: 'the tab strip shows the three titles with the second selected and its regions drawn in its layout, in order',
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
    shall: 'The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode; SHALL skip a layout leaf naming an instance the tab doesn’t hold without failing the rest of the tab; SHALL draw an instance the layout names twice once, at its first place; and SHALL keep, without drawing it, an instance no leaf names.',
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
    shall: 'The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode; SHALL skip a layout leaf naming an instance the tab doesn’t hold without failing the rest of the tab; SHALL draw an instance the layout names twice once, at its first place; and SHALL keep, without drawing it, an instance no leaf names.',
    name: 'A dangling instance id',
    when: 'a tab’s layout names an instance id the tab doesn’t hold',
    then: 'the tab draws its other regions and nothing is drawn for the missing one',
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
    shall: 'The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode; SHALL skip a layout leaf naming an instance the tab doesn’t hold without failing the rest of the tab; SHALL draw an instance the layout names twice once, at its first place; and SHALL keep, without drawing it, an instance no leaf names.',
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
    when: 'the surface is given mix’s rig document with mix’s region kinds and definitions for them, and a person edits it',
    then: 'every tab and region of it is drawn, and each edit made (choosing, adding, duplicating and removing a tab; moving, binding and adding a region; undo and redo) sends an intent mix’s store already has a method for',
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

export const MixsDocumentToday: Story = scenario(
  {
    requirement: 'Version 1 documents still draw',
    shall: 'The surface SHALL draw a version 1 document (rows of region instance ids) as a column of its rows, each row’s regions taking equal shares, and an intent that changes a version 1 document SHALL be applied as on its version 2 reading, returning a version 2 document.',
    name: 'Mix’s document today',
    when: 'the surface is given mix’s version 1 default document',
    then: 'every tab draws its rows top to bottom and each row’s regions side by side in equal shares',
    check: async ({ canvasElement }) => {
      // Hybrid: waveforms · session + throws · channels + signal · health.
      const at = (id: string) => canvasElement.querySelector(`[data-leaf="${id}"]`)!.getBoundingClientRect();
      await waitFor(() => expect(canvasElement.querySelector('[data-leaf="hybrid-region-6"]')).toBeTruthy());
      const tops = [1, 2, 4, 6].map((n) => at(`hybrid-region-${n}`).top);
      await expect([...tops].sort((a, b) => a - b)).toEqual(tops);
      await expect(Math.abs(at('hybrid-region-2').top - at('hybrid-region-3').top)).toBeLessThan(1);
      await expect(at('hybrid-region-2').width).toBeCloseTo(at('hybrid-region-3').width, 0);
    },
  },
  { render: () => <Workspace name="Rig" document={{ ...mixDefaultDocument(), active: 'hybrid' }} panes={mixPanes} pane={workspacePane} /> },
) as Story;

export const TheFirstResizeUpgrades: Story = scenario(
  {
    requirement: 'Version 1 documents still draw',
    shall: 'The surface SHALL draw a version 1 document (rows of region instance ids) as a column of its rows, each row’s regions taking equal shares, and an intent that changes a version 1 document SHALL be applied as on its version 2 reading, returning a version 2 document.',
    name: 'The first resize upgrades',
    when: 'an app applies a resize intent to a version 1 document',
    then: 'the result is a version 2 document with the same regions and the new shares',
    check: async () => {
      const v1 = mixDefaultDocument();
      const next = applySurfaceIntent(v1, { type: 'resizeSplit', tab: 'hybrid', split: 'hybrid-row-2', shares: [3, 1] });
      await expect(next.version).toBe(2);
      const tab = readDocument(next).tabs.find((t) => t.id === 'hybrid')!;
      await expect(tab.regions.map((r) => r.id)).toEqual(v1.tabs[2].regions.map((r) => r.id));
      await expect(splits(tab.layout).find((s) => s.id === 'hybrid-row-2')!.children.map((c) => c.share)).toEqual([3, 1]);
    },
  },
  { render: () => <Workspace name="Rig" document={mixDefaultDocument()} panes={mixPanes} pane={workspacePane} /> },
) as Story;

const TWICE: SurfaceDocument = {
  version: 2,
  active: 't',
  tabs: [{ id: 't', title: 'T', layout: { id: 't-row', split: 'row', children: [{ node: 'a', share: 1 }, { node: 'c', share: 1 }, { node: 'a', share: 1 }] }, regions: [region('a', 'loopGrid', 'Grid'), region('c', 'cuts', 'Cuts'), region('spare', 'stems', 'Spare stems')] }],
};

export const ALeafNamedTwice: Story = scenario(
  {
    requirement: 'What the surface doesn’t know is drawn, not dropped',
    shall: 'The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode; SHALL skip a layout leaf naming an instance the tab doesn’t hold without failing the rest of the tab; SHALL draw an instance the layout names twice once, at its first place; and SHALL keep, without drawing it, an instance no leaf names.',
    name: 'A leaf named twice',
    when: 'a tab’s layout names the same instance in two places',
    then: 'the instance is drawn once, at its first place, and the rest of the tab draws normally',
    check: async ({ canvasElement }) => {
      await expect(drawn(canvasElement)).toEqual(['a', 'c']);
    },
  },
  { render: () => <Workspace name="Live" document={TWICE} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

export const AnInstanceNoLeafNames: Story = scenario(
  {
    requirement: 'What the surface doesn’t know is drawn, not dropped',
    shall: 'The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode; SHALL skip a layout leaf naming an instance the tab doesn’t hold without failing the rest of the tab; SHALL draw an instance the layout names twice once, at its first place; and SHALL keep, without drawing it, an instance no leaf names.',
    name: 'An instance no leaf names',
    when: 'a tab holds an instance its layout doesn’t name',
    then: 'the instance is not drawn and is still in the document after another region is edited',
    check: async ({ canvasElement }) => {
      await expect(canvasElement.querySelector('[data-leaf="spare"]')).toBeNull();
      const next = readDocument(applySurfaceIntent(TWICE, { type: 'retitleRegion', tab: 't', region: 'c', title: 'Cuts!' }));
      await expect(next.tabs[0].regions.map((r) => r.id)).toEqual(['a', 'c', 'spare']);
    },
  },
  { render: () => <Workspace name="Live" document={TWICE} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

const NEWER = { version: 3, active: 'grid', tabs: [{ id: 'grid', title: 'Grid', zones: [] }] } as unknown as SurfaceDocument;
export const ANewerDocument: Story = scenario(
  {
    requirement: 'A version the surface doesn’t read is not drawn',
    shall: 'The surface SHALL draw a document whose version it doesn’t read (any but 1 and 2) as a notice naming that version, with no tabs, regions or tools, SHALL send no intent for it, and the pure applier SHALL return such a document as given.',
    name: 'A newer document',
    when: 'the surface is given a version 3 document',
    then: 'it shows a notice that the surface was saved by a newer version (3), and no tab, region or tool',
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('alert')).toHaveTextContent('newer version (3)');
      await expect(canvas.queryAllByRole('tab')).toHaveLength(0);
      await expect(canvas.queryAllByRole('button')).toHaveLength(0);
      await expect(drawn(canvasElement)).toEqual([]);
    },
  },
  { render: () => <Workspace name="Live" document={NEWER} panes={workspacePanes} pane={workspacePane} editing /> },
) as Story;

export const NothingEditsANewerDocument: Story = scenario(
  {
    requirement: 'A version the surface doesn’t read is not drawn',
    shall: 'The surface SHALL draw a document whose version it doesn’t read (any but 1 and 2) as a notice naming that version, with no tabs, regions or tools, SHALL send no intent for it, and the pure applier SHALL return such a document as given.',
    name: 'Nothing edits a newer document',
    when: 'an app applies intents to a version 3 document',
    then: 'the applier returns the very document it was given each time',
    check: async () => {
      for (const intent of [{ type: 'addTab' }, { type: 'removeTab', tab: 'grid' }, { type: 'selectTab', tab: 'grid' }] as const) await expect(applySurfaceIntent(NEWER, intent)).toBe(NEWER);
    },
  },
  { render: () => <Workspace name="Live" document={NEWER} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

export const AnAppsOwnFieldsSurviveAnEdit: Story = scenario(
  {
    requirement: 'Fields the surface doesn’t know are kept',
    shall: 'The surface and the pure applier SHALL carry every field they don’t know, on the document, a tab or an instance, through every reading and edit unchanged, so an app can keep its own data in the document.',
    name: 'An app’s own fields survive an edit',
    when: 'an app keeps a field of its own on the document, on a tab and on an instance, then applies a rename and a duplicate',
    then: 'all three fields are still there, and the duplicated tab and its instances carry them too',
    check: async () => {
      const mine = { ...workspaceDocument, savedBy: 'rig', tabs: workspaceDocument.tabs.map((t) => ({ ...t, scene: 4, regions: t.regions.map((r) => ({ ...r, pinned: true })) })) } as unknown as SurfaceDocument;
      const renamed = applySurfaceIntent(mine, { type: 'renameTab', tab: 'stage', title: 'Front' });
      const next = readDocument(applySurfaceIntent(renamed, { type: 'duplicateTab', tab: 'stage' })) as unknown as { savedBy: string; tabs: { scene: number; regions: { pinned: boolean }[] }[] };
      await expect(next.savedBy).toBe('rig');
      await expect(next.tabs.length).toBe(workspaceDocument.tabs.length + 1);
      await expect(next.tabs.every((t) => t.scene === 4)).toBe(true);
      await expect(next.tabs.flatMap((t) => t.regions).every((r) => r.pinned)).toBe(true);
    },
  },
  { render: () => <Workspace name="Live" document={workspaceDocument} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

export const AVersion1DocumentsOwnFields: Story = scenario(
  {
    requirement: 'Fields the surface doesn’t know are kept',
    shall: 'The surface and the pure applier SHALL carry every field they don’t know, on the document, a tab or an instance, through every reading and edit unchanged, so an app can keep its own data in the document.',
    name: 'A version 1 document’s own fields',
    when: 'a version 1 document with a field of the app’s own on it and on a tab is upgraded by a resize',
    then: 'the version 2 result still carries both fields',
    check: async () => {
      const v1 = { ...mixDefaultDocument(), rig: 'main' } as unknown as SurfaceDocument;
      const tagged = { ...v1, tabs: v1.tabs.map((t) => ({ ...t, colour: 'teal' })) } as unknown as SurfaceDocument;
      const next = applySurfaceIntent(tagged, { type: 'resizeSplit', tab: 'hybrid', split: 'hybrid-row-2', shares: [3, 1] }) as unknown as { version: number; rig: string; tabs: { colour: string }[] };
      await expect(next.version).toBe(2);
      await expect(next.rig).toBe('main');
      await expect(next.tabs.every((t) => t.colour === 'teal')).toBe(true);
    },
  },
  { render: () => <Workspace name="Rig" document={mixDefaultDocument()} panes={mixPanes} pane={workspacePane} /> },
) as Story;

export const ASavedDocumentWithProblems: Story = scenario(
  {
    requirement: 'A saved document can be checked',
    shall: 'Zen SHALL provide a pure function that lists a document’s problems as plain data (a version it doesn’t read, an open tab id no tab has, a repeated tab or instance id, a leaf naming no instance, an instance no leaf names, a leaf named twice, a share that isn’t positive), and that repairs nothing.',
    name: 'A saved document with problems',
    when: 'an app checks a document whose layout names one instance twice and leaves another out',
    then: 'the check lists a repeated leaf and an orphan instance, each with its tab and id, and the document is as it was',
    check: async () => {
      const before = JSON.stringify(TWICE);
      await expect(checkDocument(TWICE)).toEqual([
        { issue: 'repeated-leaf', tab: 't', id: 'a' },
        { issue: 'orphan-region', tab: 't', id: 'spare' },
      ]);
      await expect(JSON.stringify(TWICE)).toBe(before);
    },
  },
  { render: () => <Workspace name="Live" document={TWICE} panes={workspacePanes} pane={workspacePane} /> },
) as Story;

export const ASoundDocument: Story = scenario(
  {
    requirement: 'A saved document can be checked',
    shall: 'Zen SHALL provide a pure function that lists a document’s problems as plain data (a version it doesn’t read, an open tab id no tab has, a repeated tab or instance id, a leaf naming no instance, an instance no leaf names, a leaf named twice, a share that isn’t positive), and that repairs nothing.',
    name: 'A sound document',
    when: 'an app checks a document with nothing wrong, in either version',
    then: 'the check lists nothing',
    check: async () => {
      await expect(checkDocument(workspaceDocument)).toEqual([]);
      await expect(checkDocument(mixDefaultDocument())).toEqual([]);
    },
  },
  { render: () => <Workspace name="Live" document={workspaceDocument} panes={workspacePanes} pane={workspacePane} /> },
) as Story;
