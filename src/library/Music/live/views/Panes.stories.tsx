import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { Workspace } from '../../../layout/Workspace/Workspace';
import { workspacePane } from '../../../layout/Workspace/content.story';
import { tabOf, workspaceDocument, workspacePanes, workspaceTargets } from '../../../layout/Workspace/Workspace.fixtures';
import type { PaneDefinition, SurfaceDocument } from '../../../layout/Workspace/Workspace.types';
import { isLivePaneKind, livePanes } from '../panes';
import { useLiveSet } from './LiveSet.story';
import { LIVE_DOCUMENT } from './views';

// The app's pane kinds: plain data the surface lays out by, a slot per instance the app fills, the
// palette made of exactly the definitions, and the Music live panes as one ready-made set.

const meta = {
  title: 'Music/Live/Pane registry',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 1440, h: 900 },
    spec: {
      capability: 'live-pane-registry',
      purpose: 'How an app defines the pane kinds its surface can hold, how they reach the palette, and the ready-made Music live set.',
      requirement: 'The app defines its pane kinds',
      shall: 'The surface SHALL take the app’s pane definitions as plain data, each naming its kind, its label, an optional description, its forms, its priority and whether it brings its own plate and head, and the binding targets it can follow, and SHALL draw each region in a slot the app fills for that instance.',
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;


/** A kind of the app's own that zen has never seen: a notes card. */
const NOTES: PaneDefinition = {
  kind: 'notes',
  label: 'Set notes',
  description: 'What to remember on stage',
  forms: [{ id: 'card', min: { w: { chars: { body: 24 } }, h: { control: 3 } }, ideal: { w: { chars: { body: 40 } }, h: { control: 5 } }, grow: { w: true } }],
  priority: 'context',
};
const NOTES_DOC: SurfaceDocument = { version: 2, active: 'n', tabs: [tabOf('n', 'Notes', [['loopGrid', 'notes']])] };

export const AnAppsOwnPane: Story = scenario(
  {
    name: 'An app’s own pane',
    when: 'an app defines a kind the surface has never seen and a tab holds an instance of it',
    then: 'the region shows the app’s content for that instance at a size from the kind’s own forms',
    check: async ({ canvasElement }) => {
      await expect(within(canvasElement).getByTestId('pane-n-2')).toHaveTextContent('notes');
      await expect(canvasElement.querySelector('[data-leaf="n-2"]')).toHaveAttribute('data-form', 'card');
    },
  },
  { render: () => <Workspace name="Live" document={NOTES_DOC} panes={[...workspacePanes, NOTES]} pane={workspacePane} /> },
) as Story;

const TWO: SurfaceDocument = {
  version: 1,
  active: 't',
  tabs: [
    {
      id: 't',
      title: 'T',
      rows: [['a', 'b']],
      regions: [
        { id: 'a', kind: 'arp', title: 'Arp left', binding: { mode: 'fixed', target: 'bass' } },
        { id: 'b', kind: 'arp', title: 'Arp right', binding: { mode: 'selected' } },
      ],
    },
  ],
};

export const TheSlotKnowsItsInstance: Story = scenario(
  {
    name: 'The slot knows its instance',
    when: 'a tab holds two instances of one kind with different bindings',
    then: 'the app’s slot is asked for each instance with that instance’s id, title and resolved target',
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByTestId('pane-a')).toHaveTextContent('Arp left → bass');
      await expect(canvas.getByTestId('pane-b')).toHaveTextContent('Arp right → keys');
    },
  },
  { render: () => <Workspace name="Live" document={TWO} panes={workspacePanes} selected="keys" pane={workspacePane} /> },
) as Story;

export const FormsStepDownOnASmallWindow: Story = scenario(
  {
    name: 'Forms step down on a small window',
    when: 'the surface is narrowed until a region’s widest form no longer fits',
    then: 'the region steps down to its next form, as the kind’s forms list them, and no region overflows',
    check: async ({ canvasElement }) => {
      const placed = [...canvasElement.querySelectorAll<HTMLElement>('[data-leaf][data-form]')];
      const firstForm = (kind: string) => workspacePanes.find((p) => p.kind === kind)!.forms[0].id;
      const kinds = workspaceDocument.tabs[0].regions.map((r) => r.kind);
      await expect(placed.some((el, i) => el.dataset.form !== firstForm(kinds[i]))).toBe(true);
      await expect(canvasElement.querySelector('[data-cramped]')).toBeNull();
    },
  },
  {
    parameters: { frame: { w: 900, h: 700 } },
    render: () => <Workspace name="Live" document={{ ...workspaceDocument, tabs: [workspaceDocument.tabs[0]] }} panes={workspacePanes} pane={workspacePane} />,
  },
) as Story;

export const ThePaletteListsTheDefinitions: Story = scenario(
  {
    requirement: 'The palette is the app’s definitions',
    shall: 'The palette in edit mode SHALL offer exactly the kinds the app defined, in the order given, each by its label and description.',
    name: 'The palette lists the definitions',
    when: 'a person opens the palette in edit mode',
    then: 'it lists every defined kind by its label, in the app’s order, and no other',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'open the palette' }));
    },
    check: async ({ canvasElement }) => {
      const palette = within(within(canvasElement).getByRole('group', { name: 'Palette' }));
      await expect(palette.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(workspacePanes.map((p) => `add ${p.label} to this tab`));
      for (const p of workspacePanes) await expect(palette.getByText(p.description!)).toBeTruthy();
    },
  },
  { render: () => <Workspace name="Live" document={workspaceDocument} panes={workspacePanes} editing pane={workspacePane} /> },
) as Story;

export const NoDefinitionsNoPalette: Story = scenario(
  {
    requirement: 'The palette is the app’s definitions',
    shall: 'The palette in edit mode SHALL offer exactly the kinds the app defined, in the order given, each by its label and description.',
    name: 'No definitions, no palette',
    when: 'the app gives no pane definitions',
    then: 'edit mode offers no add and no palette, and still lets regions be moved and removed',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Mix tools' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.queryByRole('button', { name: /palette/ })).toBeNull();
      await expect(canvas.queryByRole('button', { name: /^add .* (to this tab|beside)/ })).toBeNull();
      await expect(canvas.getByRole('button', { name: 'move Mix up' })).toBeTruthy();
      await expect(canvas.getByRole('button', { name: 'remove Mix' })).toBeTruthy();
    },
  },
  { render: () => <Workspace name="Live" document={workspaceDocument} targets={workspaceTargets} editing /> },
) as Story;

function LiveOne() {
  const live = useLiveSet({ running: false });
  return <Workspace name="Hidden Signals" document={LIVE_DOCUMENT} panes={livePanes} selected={live.selected} pane={(region, target) => <div data-testid={`pane-${region.id}`} data-kind={region.kind} style={{ height: '100%' }}>{live.content(region, target)}</div>} />;
}

export const TheLiveViewsUseTheSet: Story = scenario(
  {
    requirement: 'The Music live panes are a ready-made set',
    shall: 'Zen SHALL provide the sixteen Music live panes as one set of pane definitions an app may use whole, use in part, or combine with its own, and the live views SHALL be built from that set.',
    name: 'The live views use the set',
    when: 'the ONE tab of the live views is opened',
    then: 'every region on it is a Music live pane drawn from the ready-made set',
    check: async ({ canvasElement }) => {
      const panes = [...canvasElement.querySelectorAll<HTMLElement>('[data-testid^="pane-"]')];
      await expect(panes.length).toBe(LIVE_DOCUMENT.tabs[0].regions.length);
      for (const p of panes) {
        await expect(isLivePaneKind(p.dataset.kind!)).toBe(true);
        await expect(p.querySelector('.live-pane')).toBeTruthy();
      }
    },
  },
  { render: () => <LiveOne /> },
) as Story;

export const AnAppMixesTheSetWithItsOwn: Story = scenario(
  {
    requirement: 'The Music live panes are a ready-made set',
    shall: 'Zen SHALL provide the sixteen Music live panes as one set of pane definitions an app may use whole, use in part, or combine with its own, and the live views SHALL be built from that set.',
    name: 'An app mixes the set with its own',
    when: 'an app gives the surface the ready-made set plus one kind of its own',
    then: 'the palette lists the sixteen live panes and the app’s kind, and a tab can hold both',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'open the palette' }));
    },
    check: async ({ canvasElement }) => {
      const palette = within(within(canvasElement).getByRole('group', { name: 'Palette' }));
      await expect(palette.getAllByRole('button')).toHaveLength(17);
      await expect(palette.getByRole('button', { name: 'add Set notes to this tab' })).toBeTruthy();
      await expect(within(canvasElement).getByTestId('pane-mixed-2')).toHaveTextContent('notes');
      await expect(canvasElement.querySelector('[data-testid="pane-mixed-1"] .live-pane')).toBeTruthy();
    },
  },
  {
    render: () => {
      const doc: SurfaceDocument = {
        version: 1,
        active: 'mixed',
        tabs: [{ id: 'mixed', title: 'Mixed', rows: [['mixed-1', 'mixed-2']], regions: [{ id: 'mixed-1', kind: 'rig', title: 'Rig health', binding: { mode: 'selected' } }, { id: 'mixed-2', kind: 'notes', title: 'Set notes', binding: { mode: 'selected' } }] }],
      };
      return <MixedApp document={doc} />;
    },
  },
) as Story;

function MixedApp({ document }: { document: SurfaceDocument }) {
  const live = useLiveSet({ running: false });
  return (
    <Workspace
      name="Mine"
      document={document}
      panes={[...livePanes, NOTES]}
      editing
      pane={(region, target) => (isLivePaneKind(region.kind) ? <div data-testid={`pane-${region.id}`} style={{ height: '100%' }}>{live.content(region, target)}</div> : workspacePane(region, target))}
    />
  );
}
