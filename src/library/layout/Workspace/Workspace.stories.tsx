import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { Workspace } from './Workspace';
import WorkspaceSvelte from './Workspace.svelte';
import { workspacePane } from './content.story';
import { useSurfaceHost } from './host.story';
import { applySurfaceIntent } from './surface';
import { workspaceArgTypes, workspaceDocument, workspaceStories as s } from './Workspace.fixtures';
import type { SurfaceDocument, SurfaceIntent } from './Workspace.types';

// The surface's edit mode: every edit leaves as one intent the app applies; undo and redo are the
// app's; zen keeps only visual state. The fixture stories run in both renderers (the toolbar's
// Renderer) with `onIntent` a spy, so a play reads exactly what the surface sent and that the
// document stayed as given; the hosted stories apply each intent as an app would.

const meta = {
  title: 'Design OS/Layout/Workspace',
  component: Workspace,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 1440, h: 900 },
    spec: {
      capability: 'live-surface-editing',
      purpose: 'Perform and edit modes of the surface an app composes its DAW on: every edit as one intent the app applies, undo and redo as the app’s, and the visual state zen keeps.',
      requirement: 'Every edit leaves as one intent',
      shall: 'Every change a person makes through the surface SHALL leave it as exactly one intent naming the edit and its target: choosing, adding, renaming, duplicating or removing a tab; adding, removing, moving (left, right, up, down), retitling or rebinding a region; and undo and redo.',
    },
  },
  args: { name: 'Live', document: workspaceDocument },
  argTypes: workspaceArgTypes,
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Workspace, WorkspaceSvelte);

/** A fixture with `onIntent` a spy. */
const spied = (fixture: Parameters<typeof story>[0], extra: Partial<Story> = {}): Story => story(fixture, { ...extra, args: { ...fixture.args, onIntent: fn(), ...(extra.args ?? {}) } });

/** The intents the spy heard. */
const sent = (args: { onIntent?: unknown }): SurfaceIntent[] => ((args.onIntent as { mock: { calls: [SurfaceIntent][] } }).mock.calls ?? []).map(([i]) => i);


export const ChoosingATab: Story = scenario(
  {
    name: 'Choosing a tab',
    when: 'a person chooses the third tab',
    then: 'the surface sends one intent to select that tab and shows it only once the app’s document opens it',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('tab', { name: 'Arp & follow' }));
    },
    check: async ({ canvasElement, args }) => {
      await expect(sent(args)).toEqual([{ type: 'selectTab', tab: 'arp' }]);
      // The app's document still opens the grid: the surface shows the grid.
      await expect(within(canvasElement).getByRole('tab', { name: 'Session grid' })).toHaveAttribute('aria-selected', 'true');
    },
  },
  spied(s.Perform),
);

export const MovingARegion: Story = scenario(
  {
    name: 'Moving a region',
    when: 'a person moves a region one place to the right in edit mode',
    then: 'the surface sends one move intent naming the tab, the region and the direction',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'move Loop grid right' }));
    },
    check: async ({ args }) => {
      await expect(sent(args)).toEqual([{ type: 'moveRegion', tab: 'stage', region: 'stage-1', direction: 'right' }]);
    },
  },
  spied(s.Picked),
);

export const AddingFromThePalette: Story = scenario(
  {
    name: 'Adding from the palette',
    when: 'a person adds a kind from the palette to a row',
    then: 'the surface sends one add intent naming the tab, the kind and where it goes, and the app picks the new instance’s id',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'add Transitions to this tab' }));
    },
    check: async ({ args }) => {
      await expect(sent(args)).toEqual([{ type: 'addRegion', tab: 'stage', kind: 'cuts', row: 1 }]);
    },
  },
  spied(s.Palette),
);

export const RebindingARegion: Story = scenario(
  {
    name: 'Rebinding a region',
    when: 'a person binds a region to a fixed target from the targets the app offers',
    then: 'the surface sends one bind intent naming the tab, the region and the fixed binding',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(within(canvasElement).getByRole('radiogroup', { name: 'Bind Loop grid' })).getByRole('radio', { name: 'Bass' }));
    },
    check: async ({ args }) => {
      await expect(sent(args)).toEqual([{ type: 'bindRegion', tab: 'stage', region: 'stage-1', binding: { mode: 'fixed', target: 'bass' } }]);
    },
  },
  spied(s.Picked),
);

export const RenamingATab: Story = scenario(
  {
    name: 'Renaming a tab',
    when: 'a person renames a tab and confirms',
    then: 'the surface sends one rename intent with the new title, and cancelling sends nothing',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'rename My stage' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Cancel renaming My stage' }));
      await userEvent.click(canvas.getByRole('button', { name: 'rename My stage' }));
      const field = canvas.getByRole('textbox', { name: 'Name for My stage' });
      await userEvent.clear(field);
      await userEvent.type(field, 'Opener');
      await userEvent.click(canvas.getByRole('button', { name: 'Save name for My stage' }));
    },
    check: async ({ canvasElement, args }) => {
      await expect(sent(args)).toEqual([{ type: 'renameTab', tab: 'stage', title: 'Opener' }]);
      // The app didn't apply it: the strip still reads the old name.
      await expect(within(canvasElement).getByRole('tab', { name: 'My stage' })).toBeTruthy();
    },
  },
  spied(s.Edit),
);

export const UndoTheAppCanDo: Story = scenario(
  {
    requirement: 'Undo and redo are the app’s',
    shall: 'The surface SHALL offer undo and redo only when the app says each is possible, and SHALL send them as intents without keeping any history of its own.',
    name: 'Undo the app can do',
    when: 'the app says undo is possible and a person presses undo',
    then: 'the surface sends one undo intent',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'undo' }));
    },
    check: async ({ canvasElement, args }) => {
      await expect(sent(args)).toEqual([{ type: 'undo' }]);
      await expect(within(canvasElement).getByRole('button', { name: 'redo' })).toHaveAttribute('aria-disabled', 'true');
    },
  },
  spied(s.History),
);

export const NothingToUndo: Story = scenario(
  {
    requirement: 'Undo and redo are the app’s',
    shall: 'The surface SHALL offer undo and redo only when the app says each is possible, and SHALL send them as intents without keeping any history of its own.',
    name: 'Nothing to undo',
    when: 'the app says undo is not possible',
    then: 'undo is shown disabled and pressing it sends nothing',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'undo' }), { pointerEventsCheck: 0 });
    },
    check: async ({ canvasElement, args }) => {
      await expect(within(canvasElement).getByRole('button', { name: 'undo' })).toHaveAttribute('aria-disabled', 'true');
      await expect(sent(args)).toEqual([]);
    },
  },
  spied(s.NoHistory),
);

/** An app without a store: every intent applied with `applySurfaceIntent`, the result handed back. */
function Applied() {
  const host = useSurfaceHost(workspaceDocument);
  return <Workspace name="Live" document={host.document} panes={s.Edit.args!.panes} targets={s.Edit.args!.targets} selected="keys" canUndo={host.canUndo} canRedo={host.canRedo} onIntent={host.onIntent} pane={workspacePane} />;
}

export const ApplyingTheSurfacesOwnIntents: Story = scenario(
  {
    requirement: 'Intents can be applied without a store',
    shall: 'Zen SHALL provide a pure function that returns the next document for a document and an intent, keeping no state, so an app or a story without a store of its own can apply what the surface sends.',
    name: 'Applying the surface’s own intents',
    when: 'a story applies every intent the surface sends to the document it gives back',
    then: 'each edit appears in the surface as soon as it is made',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'edit the views' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Mix tools' }));
      await userEvent.click(canvas.getByRole('button', { name: 'move Mix up' }));
      await userEvent.click(canvas.getByRole('button', { name: 'open the palette' }));
      await userEvent.click(canvas.getByRole('button', { name: 'add Stems beside Mix' }));
    },
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      // Mix joined the grid's row, and Stems sits beside it.
      const frames = [...canvasElement.querySelectorAll<HTMLElement>('[data-part="frame"]')].map((f) => f.dataset.kind);
      await expect(frames).toEqual(['loopGrid', 'mix', 'stems']);
      await waitFor(() => expect(canvas.getByTestId('pane-stage-1').parentElement!.closest('[data-region]')).toBeTruthy());
      // The app's history: undo takes the add back.
      await userEvent.click(canvas.getByRole('button', { name: 'undo' }));
      await waitFor(() => expect(canvasElement.querySelectorAll('[data-part="frame"]').length).toBe(2));
    },
  },
  { render: () => <Applied /> },
) as Story;

export const AnIntentThatCantApply: Story = scenario(
  {
    requirement: 'Intents can be applied without a store',
    shall: 'Zen SHALL provide a pure function that returns the next document for a document and an intent, keeping no state, so an app or a story without a store of its own can apply what the surface sends.',
    name: 'An intent that can’t apply',
    when: 'an intent names a tab or region the document doesn’t hold',
    then: 'the function returns the document unchanged',
    check: async () => {
      const doc: SurfaceDocument = workspaceDocument;
      const stale: SurfaceIntent[] = [
        { type: 'removeRegion', tab: 'stage', region: 'gone' },
        { type: 'moveRegion', tab: 'nowhere', region: 'stage-1', direction: 'left' },
        { type: 'bindRegion', tab: 'stage', region: 'gone', binding: { mode: 'selected' } },
        { type: 'renameTab', tab: 'nowhere', title: 'X' },
        { type: 'selectTab', tab: 'nowhere' },
      ];
      for (const intent of stale) await expect(applySurfaceIntent(doc, intent)).toBe(doc);
    },
  },
  { render: () => <Workspace name="Live" document={workspaceDocument} panes={s.Edit.args!.panes} pane={workspacePane} /> },
) as Story;

export const EditModeTheSurfaceKeeps: Story = scenario(
  {
    requirement: 'Zen keeps only visual state',
    shall: 'The surface SHALL keep edit mode, the region being edited and whether the palette is open as its own state when the app passes none of them, SHALL follow the app’s value for each one the app passes, and SHALL never write any of them into the document.',
    name: 'Edit mode the surface keeps',
    when: 'the app passes no edit mode and a person turns editing on',
    then: 'every region shows its edit frame and the document is unchanged',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'edit the views' }));
    },
    check: async ({ canvasElement, args }) => {
      await waitFor(() => expect(canvasElement.querySelectorAll('[data-part="frame"]').length).toBe(2));
      // Only the visual change was announced; nothing edits the document.
      await expect(sent(args)).toEqual([{ type: 'setEditing', editing: true }]);
      await expect(args.document).toBe(workspaceDocument);
    },
  },
  spied(s.EditOwn),
);

export const EditModeTheAppKeeps: Story = scenario(
  {
    requirement: 'Zen keeps only visual state',
    shall: 'The surface SHALL keep edit mode, the region being edited and whether the palette is open as its own state when the app passes none of them, SHALL follow the app’s value for each one the app passes, and SHALL never write any of them into the document.',
    name: 'Edit mode the app keeps',
    when: 'the app passes edit mode off and a person turns editing on',
    then: 'the surface asks the app to turn editing on and stays in perform mode until the app does',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'edit the views' }));
    },
    check: async ({ canvasElement, args }) => {
      await expect(sent(args)).toEqual([{ type: 'setEditing', editing: true }]);
      await expect(canvasElement.querySelectorAll('[data-part="frame"]').length).toBe(0);
    },
  },
  spied(s.Perform, { args: { editing: false } }),
);

export const PerformModeIsPlayedNotEdited: Story = scenario(
  {
    requirement: 'Zen keeps only visual state',
    shall: 'The surface SHALL keep edit mode, the region being edited and whether the palette is open as its own state when the app passes none of them, SHALL follow the app’s value for each one the app passes, and SHALL never write any of them into the document.',
    name: 'Perform mode is played, not edited',
    when: 'the surface is in perform mode',
    then: 'no region shows an edit frame, the palette is closed and every pane takes its own input',
    check: async ({ canvasElement }) => {
      await expect(canvasElement.querySelectorAll('[data-part="frame"]').length).toBe(0);
      await expect(canvasElement.querySelector('[data-part="palette"]')).toBeNull();
      // The grid's own controls take input: its first clip is a live button.
      const grid = canvasElement.querySelector<HTMLElement>('[data-testid="pane-grid-1"]')!;
      await expect(within(grid).getAllByRole('button').some((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
    },
  },
  spied(s.Perform, { render: (args) => <Workspace {...args} pane={workspacePane} /> }),
);

/** My stage at 900 × 700: the tabs step down and nothing overflows. */
export const Narrow: Story = {
  ...story(s.Narrow, { render: (args) => <Workspace {...args} pane={workspacePane} /> }),
  parameters: { frame: { w: 900, h: 700 } },
};

/** A view with nothing on it yet: it says so, and edit mode offers the palette. */
export const Empty: Story = story(s.Empty);

/** Drawn but deaf: dimmed, tools inert. */
export const Disabled: Story = { ...story(s.Disabled, { render: (args) => <Workspace {...args} pane={workspacePane} /> }) };
