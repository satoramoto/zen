import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../../storybook';
import { Workspace } from '../../../../layouts/Workspace/Workspace';
import { useSurfaceHost } from '../../../../layouts/Workspace/host.story';
import { useSurfaceMode } from '../../../../layouts/Workspace/surfaceMode.react';
import { building } from '../../../../layouts/Workspace/surfaceMode';
import { useForm } from '../../../../layouts/Assembly/forms';
import { workspacePane } from '../../../../layouts/Workspace/content.story';
import { tabOf, workspaceDocument, workspacePanes, workspaceTargets } from '../../../../layouts/Workspace/Workspace.fixtures';
import type { PaneDefinition, SurfaceDocument } from '../../../../layouts/Workspace/Workspace.types';

// The app's pane kinds: plain data the surface lays out by, a slot per instance the app fills, the
// palette made of exactly the definitions, what the slot is told, and what a missing target shows.
// (The Music live panes as a ready-made set: `Kit.stories.tsx`, `live-reference-kit`.)

const meta = {
  title: 'Music/Live/Screens/Pane registry',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 1440, h: 900 },
    spec: {
      capability: 'live-pane-registry',
      purpose: 'How an app defines the pane kinds its surface can hold, how they reach the palette, what the app’s pane is told for each instance, and what a region shows when its target is gone.',
      requirement: 'An app defines its own pane kinds',
      shall: 'The surface SHALL take the app’s pane definitions as plain data, each naming its kind, its label, an optional description, its forms, its priority and whether it brings its own plate and head, and the binding targets it can follow, and SHALL draw each region in a slot the app fills for that instance.',
      // Decisions a person made: `story-spec sync` writes these as REMOVED or RENAMED. Spent once the spec no longer has them.
      retires: [
        { requirement: 'The app defines its pane kinds', reason: 'Restated as “An app defines its own pane kinds” without its form scenario: which form a region draws is the layout’s rule.', migration: 'Read “An app defines its own pane kinds” here, and “A region draws the largest form its room fits” in live-panel-layout for the form scenario.' },
        { requirement: 'The Music live panes are a ready-made set', reason: 'Moved to live-reference-kit: the registry is the framework’s and names no particular pane.', migration: 'Read “The Music live panes are a ready-made set” in live-reference-kit.' },
      ],
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

/** A kind of the story's own with two forms, so a pane can read which one its room fits. */
const PROBE: PaneDefinition = {
  kind: 'probe',
  label: 'Probe',
  forms: [
    { id: 'wide', min: { w: { chars: { body: 60 } }, h: { control: 3 } }, ideal: { w: { chars: { body: 80 } }, h: { control: 5 } }, grow: { w: true } },
    { id: 'narrow', min: { w: { chars: { body: 12 } }, h: { control: 2 } }, ideal: { w: { chars: { body: 24 } }, h: { control: 3 } }, grow: { w: true } },
  ],
};
const PROBE_DOC: SurfaceDocument = { version: 2, active: 'p', tabs: [{ id: 'p', title: 'Probe', layout: 'p-1', regions: [{ id: 'p-1', kind: 'probe', title: 'Probe', binding: { mode: 'selected' } }] }] };

/** The app's own pane, reading what the surface tells it: the mode and the form. */
function Probe() {
  const mode = useSurfaceMode();
  const form = useForm(PROBE.forms as never);
  return (
    <p data-testid="probe" data-mode={mode.locked ? 'locked' : building(mode) ? 'building' : 'playing'} data-form={form}>
      probe
    </p>
  );
}

function Probed() {
  const host = useSurfaceHost(PROBE_DOC);
  return <Workspace name="Probe" document={host.document} panes={[PROBE]} onIntent={host.onIntent} pane={() => <Probe />} />;
}

export const TheModeReachesAnAppsOwnPane: Story = scenario(
  {
    requirement: 'A pane is told what it needs to draw',
    shall: 'The surface SHALL give the app’s pane, for each instance, the instance itself, the target it resolves to (its fixed target, else the app’s selection), its settings with every default filled in, the surface’s mode (editing or not, locked or not) and the form its room fits, and SHALL give them again whenever one changes.',
    name: 'The mode reaches an app’s own pane',
    when: 'a person turns editing on and then locks the tab, over a pane of the app’s own',
    then: 'the pane is told it is played, then built, then locked',
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByTestId('probe')).toHaveAttribute('data-mode', 'playing');
      await userEvent.click(canvas.getByRole('button', { name: 'edit the views' }));
      await waitFor(() => expect(canvas.getByTestId('probe')).toHaveAttribute('data-mode', 'building'));
      await userEvent.click(canvas.getByRole('button', { name: 'lock Probe' }));
      await waitFor(() => expect(canvas.getByTestId('probe')).toHaveAttribute('data-mode', 'locked'));
    },
  },
  { render: () => <Probed /> },
) as Story;

// Stories tagged browser below need a laid-out page: they play in a real browser, not on zen-stories' virtual DOM.
export const TheFormReachesAnAppsOwnPane: Story = { ...scenario(
  {
    requirement: 'A pane is told what it needs to draw',
    shall: 'The surface SHALL give the app’s pane, for each instance, the instance itself, the target it resolves to (its fixed target, else the app’s selection), its settings with every default filled in, the surface’s mode (editing or not, locked or not) and the form its room fits, and SHALL give them again whenever one changes.',
    name: 'The form reaches an app’s own pane',
    when: 'a pane of the app’s own with a wide and a narrow form is drawn in a window too narrow for the wide one',
    then: 'the pane is told its form is the narrow one',
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(within(canvasElement).getByTestId('probe')).toHaveAttribute('data-form', 'narrow'));
    },
  },
  { parameters: { frame: { w: 360, h: 500 } }, render: () => <Probed /> },
), tags: ['browser'] } as Story;

const GONE: SurfaceDocument = {
  version: 2,
  active: 't',
  tabs: [
    {
      id: 't',
      title: 'T',
      layout: { id: 't-row', split: 'row', children: [{ node: 'a', share: 1 }, { node: 'b', share: 1 }] },
      regions: [
        { id: 'a', kind: 'arp', title: 'Arp left', binding: { mode: 'fixed', target: 'hihat' } },
        { id: 'b', kind: 'arp', title: 'Arp right', binding: { mode: 'selected' } },
      ],
    },
  ],
};

function Rebinding() {
  const host = useSurfaceHost(GONE, { editing: true, keepEditing: true });
  return <Workspace name="Live" document={host.document} panes={workspacePanes} targets={workspaceTargets} selected="keys" editing={host.editing} onIntent={host.onIntent} pane={workspacePane} />;
}

export const AFixedTargetTheAppNoLongerOffers: Story = scenario(
  {
    requirement: 'A target that is gone is said, not guessed',
    shall: 'A region fixed to a target SHALL draw a note that its target is gone, in place of its pane, when its kind can be bound, the app says what its targets are and none of that kind has the binding’s id; the note SHALL still be movable, rebindable and removable in edit mode; and when the app gives no targets the pane SHALL be drawn with the target as written.',
    name: 'A fixed target the app no longer offers',
    when: 'a region is fixed to a track the app’s targets no longer include',
    then: 'the region shows a note that its target is gone in place of its pane, and the region beside it plays',
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.getByRole('note', { name: 'Arp left: its target is gone' })).toHaveTextContent('Arp left is bound to a target that is gone');
      await expect(canvas.queryByTestId('pane-a')).toBeNull();
      await expect(canvas.getByTestId('pane-b')).toHaveTextContent('Arp right → keys');
    },
  },
  { render: () => <Workspace name="Live" document={GONE} panes={workspacePanes} targets={workspaceTargets} selected="keys" pane={workspacePane} /> },
) as Story;

export const RebindingIt: Story = scenario(
  {
    requirement: 'A target that is gone is said, not guessed',
    shall: 'A region fixed to a target SHALL draw a note that its target is gone, in place of its pane, when its kind can be bound, the app says what its targets are and none of that kind has the binding’s id; the note SHALL still be movable, rebindable and removable in edit mode; and when the app gives no targets the pane SHALL be drawn with the target as written.',
    name: 'Rebinding it',
    when: 'a person opens the tools of a region whose target is gone and binds it to a track the app offers',
    then: 'its bind control showed no target picked, and once the app applies the bind the pane is drawn on the new track',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'Arp left tools' }));
      const bind = within(canvas.getByRole('radiogroup', { name: 'Bind Arp left' }));
      await expect(bind.getAllByRole('radio').some((r) => r.getAttribute('aria-checked') === 'true')).toBe(false);
      await userEvent.click(bind.getByRole('radio', { name: 'Bass' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await waitFor(() => expect(canvas.getByTestId('pane-a')).toHaveTextContent('Arp left → bass'));
      await expect(canvas.queryByRole('note')).toBeNull();
    },
  },
  { render: () => <Rebinding /> },
) as Story;

export const NoTargetsFromTheApp: Story = scenario(
  {
    requirement: 'A target that is gone is said, not guessed',
    shall: 'A region fixed to a target SHALL draw a note that its target is gone, in place of its pane, when its kind can be bound, the app says what its targets are and none of that kind has the binding’s id; the note SHALL still be movable, rebindable and removable in edit mode; and when the app gives no targets the pane SHALL be drawn with the target as written.',
    name: 'No targets from the app',
    when: 'the same region is drawn by an app that gives the surface no targets',
    then: 'its pane is drawn with the target as the document writes it',
    check: async ({ canvasElement }) => {
      await expect(within(canvasElement).getByTestId('pane-a')).toHaveTextContent('Arp left → hihat');
    },
  },
  { render: () => <Workspace name="Live" document={GONE} panes={workspacePanes} selected="keys" pane={workspacePane} /> },
) as Story;
