import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { scenario } from 'story-spec';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { Workspace } from './Workspace';
import { workspacePane } from './content.story';
import { useSurfaceHost } from './host.story';
import { applySurfaceIntent } from './surface';
import { workspacePanes } from './Workspace.fixtures';
import type { PaneDefinition, SurfaceDocument, SurfaceRegion } from './Workspace.types';

// What a host can count on from the surface, whatever its panes are: a pane that fails is contained,
// a host needs nothing but a document and a pane, and nothing of the document hides in the surface
// (two surfaces on one document agree). React only: region content is app content. The panes' own
// side of the contract (readings, intents, the frame) is `Music/Live/Host contract`.

const meta = {
  title: 'Design OS/Layout/Workspace/Host',
  component: Workspace,
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 1280, h: 800 },
    spec: {
      capability: 'live-host-contract',
      purpose: 'What a pane in a composed DAW reads from its host, what it asks for, how values that change every frame reach it, and what a host can count on: a failing pane contained, and nothing of the document kept in the surface.',
      requirement: 'A failing pane is contained',
      shall: 'When drawing a region’s pane throws, the surface SHALL draw a note in that region’s place naming it as stopped, with a retry that draws the pane again, SHALL tell the app which region failed and what the error said, and SHALL keep drawing and playing every other region.',
    },
  },
  args: { name: 'Live', document: { version: 2, active: 't', tabs: [] } },
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A kind of the story's own whose pane can be made to throw. */
const FRAGILE: PaneDefinition = { kind: 'fragile', label: 'Fragile', forms: [{ id: 'card', min: { w: { chars: { body: 16 } }, h: { control: 2 } }, ideal: { w: { chars: { body: 32 } }, h: { control: 4 } }, grow: { w: true } }] };
const region = (id: string, kind: string, title: string): SurfaceRegion => ({ id, kind, title, binding: { mode: 'selected' } });
const PAIR: SurfaceDocument = {
  version: 2,
  active: 't',
  tabs: [{ id: 't', title: 'Pair', layout: { id: 't-row', split: 'row', children: [{ node: 'meter', share: 1 }, { node: 'grid', share: 2 }] }, regions: [region('meter', 'fragile', 'Loudness'), region('grid', 'loopGrid', 'Loop grid')] }],
};

/** The app's own pane: it throws while `broken`. */
function Fragile({ broken }: { broken: boolean }): ReactNode {
  if (broken) throw new Error('no meter data');
  return <p data-testid="pane-meter">−14 LUFS</p>;
}

/** An app whose loudness pane is broken until the story mends it; it shows what the surface told it. */
function Breakable() {
  const [broken, setBroken] = useState(true);
  const [told, setTold] = useState<{ region: string; message: string }[]>([]);
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button type="button" onClick={() => setBroken(false)}>
          Story: mend the pane
        </button>
        <output aria-label="Story: failures told">{JSON.stringify(told)}</output>
      </div>
      <Workspace
        name="Live"
        document={PAIR}
        panes={[...workspacePanes, FRAGILE]}
        onPaneError={(failure) => setTold((all) => [...all, failure])}
        pane={(r, target) => (r.kind === 'fragile' ? <Fragile broken={broken} /> : workspacePane(r, target))}
      />
    </div>
  );
}

export const APaneThatThrows: Story = scenario(
  {
    name: 'A pane that throws',
    when: 'the app’s pane for one region throws while drawing',
    then: 'that region shows a note that it stopped, with a Retry, and the region beside it is drawn and takes input',
    and: ['the app is told the region’s id and the error’s message'],
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getByRole('alert', { name: 'Loudness stopped' })).toHaveTextContent('Loudness stopped'));
      await expect(canvas.getByRole('button', { name: 'retry Loudness' })).toBeTruthy();
      await expect(canvas.getByTestId('pane-grid')).toBeTruthy();
      await expect(within(canvas.getByTestId('pane-grid')).getAllByRole('button').some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
      await waitFor(() => expect(JSON.parse(canvas.getByLabelText('Story: failures told').textContent || '[]')).toEqual([{ region: 'meter', message: 'no meter data' }]));
    },
  },
  { render: () => <Breakable /> },
) as Story;

export const RetryDrawsThePaneAgain: Story = scenario(
  {
    name: 'Retry draws the pane again',
    when: 'the cause of a pane’s failure is gone and a person presses its Retry',
    then: 'the pane is drawn in its region and the note is gone',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getByRole('button', { name: 'retry Loudness' })).toBeTruthy());
      await userEvent.click(canvas.getByRole('button', { name: 'Story: mend the pane' }));
      await userEvent.click(canvas.getByRole('button', { name: 'retry Loudness' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getByTestId('pane-meter')).toHaveTextContent('−14 LUFS'));
      await expect(canvas.queryByRole('alert')).toBeNull();
    },
  },
  { render: () => <Breakable /> },
) as Story;

export const RetryWhileItIsStillBroken: Story = scenario(
  {
    name: 'Retry while it is still broken',
    when: 'a person presses Retry on a pane that still throws',
    then: 'the note stays, the app is told again, and the region beside it still plays',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getByRole('button', { name: 'retry Loudness' })).toBeTruthy());
      await userEvent.click(canvas.getByRole('button', { name: 'retry Loudness' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(JSON.parse(canvas.getByLabelText('Story: failures told').textContent || '[]')).toHaveLength(2));
      await expect(canvas.getByRole('alert', { name: 'Loudness stopped' })).toBeTruthy();
      await expect(canvas.getByTestId('pane-grid')).toBeTruthy();
    },
  },
  { render: () => <Breakable /> },
) as Story;

/** One kind of the app's own: a pad that counts its presses. */
const PAD: PaneDefinition = { kind: 'pad', label: 'Pad', description: 'One big button', forms: FRAGILE.forms };
const SMALLEST: SurfaceDocument = { version: 2, active: 'a', tabs: [{ id: 'a', title: 'A', layout: 'pad', regions: [region('pad', 'pad', 'Pad')] }] };

/** The smallest DAW: a document in a `useState`, the applier, one pane kind, and nothing else. */
function Smallest() {
  const [document, setDocument] = useState<SurfaceDocument>(SMALLEST);
  const [hits, setHits] = useState(0);
  return (
    <Workspace
      name="Smallest"
      document={document}
      panes={[PAD]}
      onIntent={(intent) => setDocument((now) => applySurfaceIntent(now, intent))}
      pane={(r) => (
        <button type="button" data-testid={`pane-${r.id}`} style={{ width: '100%', height: '100%' }} onClick={() => setHits((n) => n + 1)}>
          {r.title} · {hits}
        </button>
      )}
    />
  );
}

export const TheSmallestDaw: Story = scenario(
  {
    requirement: 'A host needs only a document and a pane',
    shall: 'The surface SHALL draw, play and edit a DAW for a host that gives it only a document, one pane kind of its own, a pane for each instance and a way to apply intents (zen’s pure applier will do), with no targets, selection, history, settings or frame reader; what the host doesn’t give SHALL simply not be offered.',
    name: 'The smallest DAW',
    when: 'a host with a document, one pane kind of its own and the pure applier is played, then a person turns editing on and adds a second pane from the palette',
    then: 'the first pane took the press, the second pane is drawn beside it, and no undo, redo or bind control was ever offered',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByTestId('pane-pad'));
      await expect(canvas.getByTestId('pane-pad')).toHaveTextContent('Pad · 1');
      await userEvent.click(canvas.getByRole('button', { name: 'edit the views' }));
      await expect(canvas.queryByRole('button', { name: 'undo' })).toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: 'Pad tools' }));
      await expect(canvas.queryByRole('radiogroup')).toBeNull();
      await userEvent.click(canvas.getByRole('button', { name: 'open the palette' }));
      await userEvent.click(canvas.getByRole('button', { name: 'add Pad beside Pad' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(canvasElement.querySelectorAll('[data-testid^="pane-"]')).toHaveLength(2));
      await expect(within(canvasElement).queryByRole('button', { name: 'redo' })).toBeNull();
    },
  },
  { parameters: { frame: { w: 900, h: 600 } }, render: () => <Smallest /> },
) as Story;

/** Two surfaces drawing one document the app keeps: a main screen and a second one. */
function TwoScreens() {
  const host = useSurfaceHost(PAIR);
  const pane = (r: SurfaceRegion, target: string | undefined) => (r.kind === 'fragile' ? <p data-testid={`pane-${r.id}`}>−14 LUFS</p> : workspacePane(r, target));
  const panes = [...workspacePanes, FRAGILE];
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--space-2)', height: '100%' }}>
      <section aria-label="First screen" style={{ minHeight: 0 }}>
        <Workspace name="First" document={host.document} panes={panes} onIntent={host.onIntent} pane={pane} />
      </section>
      <section aria-label="Second screen" style={{ minHeight: 0 }}>
        <Workspace name="Second" document={host.document} panes={panes} onIntent={host.onIntent} pane={pane} />
      </section>
    </div>
  );
}
const kinds = (el: HTMLElement): (string | undefined)[] => [...el.querySelectorAll<HTMLElement>('[data-leaf]')].map((l) => l.dataset.leaf);

export const AnEditInOneSurfaceAppearsInTheOther: Story = scenario(
  {
    requirement: 'Nothing of the document hides in the surface',
    shall: 'Two surfaces given the same document SHALL draw the same tabs and regions, an edit made in one SHALL appear in the other as soon as the app applies it, and each SHALL keep its own visual state (edit mode, open tools, the palette) apart from the other’s.',
    name: 'An edit in one surface appears in the other',
    when: 'two surfaces draw one document and a person swaps two regions in the first',
    then: 'both surfaces draw the regions in the new order',
    and: ['the second surface is still in perform mode, with no edit frames'],
    act: async ({ canvasElement }) => {
      const first = within(within(canvasElement).getByRole('region', { name: 'First screen' }));
      await userEvent.click(first.getByRole('button', { name: 'edit the views' }));
      await userEvent.click(first.getByRole('button', { name: 'Loudness tools' }));
      await userEvent.click(first.getByRole('button', { name: 'move Loudness right' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      const first = canvas.getByRole('region', { name: 'First screen' });
      const second = canvas.getByRole('region', { name: 'Second screen' });
      await waitFor(() => expect(kinds(first)).toEqual(['grid', 'meter']));
      await expect(kinds(second)).toEqual(['grid', 'meter']);
      await expect(first.querySelectorAll('[data-part="frame"]').length).toBe(2);
      await expect(second.querySelectorAll('[data-part="frame"]').length).toBe(0);
      await expect(within(second).getByRole('button', { name: 'edit the views' })).toBeTruthy();
    },
  },
  { parameters: { frame: { w: 1280, h: 900 } }, render: () => <TwoScreens /> },
) as Story;
