import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { Workspace } from '../../../layout/Workspace/Workspace';
import type { PaneDefinition, SurfaceDocument, SurfaceIntent } from '../../../layout/Workspace/Workspace.types';
import { LIVE_PANES } from '../panes';
import { Strips, strips } from './Strips.story';
import { LIVE_TARGETS } from './targets';

// A pane's settings: what of the app's it shows. A kind declares them as plain data; a region carries
// its values; the sheet edits them, one configure per change; the app's `pane` draws from them. The
// live panes declare which tracks, cuts and moves they show. React only: region content is app content.

const meta = {
  title: 'Music/Live/Pane settings',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 1440, h: 900 },
    spec: {
      capability: 'live-pane-settings',
      purpose: 'Settings a pane kind declares, the sheet that edits a region’s, and the values a region carries to the app.',
      requirement: 'A pane kind declares its settings',
      shall: 'A pane definition SHALL be able to declare settings as plain data, each a choice, several of a set of choices, a toggle, a number in a range, a pick of the app’s targets, or plain data the pane edits itself, with a label and a default, and a region SHALL carry its own values for them in the document; a plain-data setting SHALL reach the pane and SHALL never be listed in the settings sheet.',
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A kind of the story's own with one of each setting. */
const NOTES: PaneDefinition = {
  kind: 'notes',
  label: 'Set notes',
  forms: [{ id: 'card', min: { w: { chars: { body: 20 } }, h: { control: 2 } }, ideal: { w: { chars: { body: 40 } }, h: { control: 4 } }, grow: { w: true } }],
  settings: [
    { key: 'size', label: 'Text size', type: 'choice', options: [{ value: 's', label: 'Small' }, { value: 'l', label: 'Large' }], default: 'l' },
    { key: 'dim', label: 'Dim between songs', type: 'toggle', default: false },
    { key: 'lines', label: 'Lines', type: 'number', min: 1, max: 12, step: 1, default: 4 },
    { key: 'tracks', label: 'Tracks', type: 'targets', of: 'track', default: 'all' },
  ],
};

/** The same card with a pick of several: which of the night's lists it shows. */
const LISTS: PaneDefinition = {
  ...NOTES,
  settings: [...NOTES.settings!, { key: 'lists', label: 'Lists', type: 'choices', options: [{ value: 'cues', label: 'Cues' }, { value: 'keys', label: 'Keys' }, { value: 'guests', label: 'Guests' }], default: ['cues'] }],
};

const notesDoc = (settings?: Record<string, unknown>): SurfaceDocument => ({
  version: 2,
  active: 't',
  tabs: [{ id: 't', title: 'Notes', layout: 'n', regions: [{ id: 'n', kind: 'notes', title: 'Set notes', binding: { mode: 'selected' }, ...(settings ? { settings: settings as Record<string, string> } : {}) }] }],
});

const shown = (el: HTMLElement): unknown => JSON.parse(within(el).getByTestId('settings').textContent || '{}');
const onNotesIntent = fn();
const sent = (): SurfaceIntent[] => (onNotesIntent.mock.calls as [SurfaceIntent][]).map(([i]) => i);

export const ARegionWithNoValuesYet: Story = scenario(
  {
    name: 'A region with no values yet',
    when: 'a pane kind declares a setting and a region of it carries no value for it',
    then: 'the app’s `pane` receives the setting’s default',
    check: async ({ canvasElement }) => {
      await expect(shown(canvasElement)).toEqual({ size: 'l', dim: false, lines: 4, tracks: LIVE_TARGETS.filter((t) => t.kind === 'track').map((t) => t.id) });
    },
  },
  { render: () => <Workspace name="Notes" document={notesDoc()} panes={[NOTES]} targets={LIVE_TARGETS} pane={(_r, _t, settings) => <pre data-testid="settings">{JSON.stringify(settings)}</pre>} /> },
) as Story;

export const AValueTheDefinitionNoLongerDeclares: Story = scenario(
  {
    name: 'A value the definition no longer declares',
    when: 'a region carries a value for a setting its kind no longer declares',
    then: 'the value is kept in the document and not shown in the settings sheet',
    act: async ({ canvasElement }) => {
      onNotesIntent.mockClear();
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'Set notes tools' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Set notes settings' }));
      await userEvent.click(within(canvas.getByRole('group', { name: 'Set notes settings' })).getByRole('checkbox', { name: 'Dim between songs' }));
    },
    check: async ({ canvasElement }) => {
      const sheet = within(canvasElement).getByRole('group', { name: 'Set notes settings' });
      await expect(sheet.querySelector('[data-setting="colour"]')).toBeNull();
      await expect(sent().filter((i) => i.type === 'configureRegion')).toEqual([{ type: 'configureRegion', tab: 't', region: 'n', settings: { colour: 'red', dim: true } }]);
    },
  },
  { render: () => <Workspace name="Notes" document={notesDoc({ colour: 'red' })} panes={[NOTES]} targets={LIVE_TARGETS} editing onIntent={onNotesIntent} pane={() => <p>notes</p>} /> },
) as Story;

/** A kind with a plain-data setting beside an ordinary one. */
const SKETCH: PaneDefinition = {
  kind: 'sketch',
  label: 'Sketch',
  forms: NOTES.forms,
  settings: [
    { key: 'ink', label: 'Ink', type: 'choice', options: [{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }], default: 'dark' },
    { key: 'strokes', label: 'Strokes', type: 'data', default: [] },
  ],
};
const sketchDoc: SurfaceDocument = {
  version: 2,
  active: 't',
  tabs: [{ id: 't', title: 'Sketch', layout: 's', regions: [{ id: 's', kind: 'sketch', title: 'Sketch', binding: { mode: 'selected' }, settings: { strokes: [{ from: [0, 0], to: [1, 1] }] } }] }],
};

export const APlainDataSetting: Story = scenario(
  {
    name: 'A plain-data setting',
    when: 'a pane kind declares a plain-data setting and a region carries a value for it',
    then: 'the pane receives the value and the settings sheet doesn’t list it',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'Sketch tools' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Sketch settings' }));
    },
    check: async ({ canvasElement }) => {
      await expect(shown(canvasElement)).toEqual({ ink: 'dark', strokes: [{ from: [0, 0], to: [1, 1] }] });
      const sheet = within(canvasElement).getByRole('group', { name: 'Sketch settings' });
      await expect(sheet.querySelector('[data-setting="ink"]')).toBeTruthy();
      await expect(sheet.querySelector('[data-setting="strokes"]')).toBeNull();
    },
  },
  { render: () => <Workspace name="Sketch" document={sketchDoc} panes={[SKETCH]} editing pane={(_r, _t, settings) => <pre data-testid="settings">{JSON.stringify(settings)}</pre>} /> },
) as Story;

export const ChoosingWhichTracksTheStripsShow: Story = scenario(
  {
    requirement: 'The settings sheet edits a region’s settings',
    shall: 'A region’s tools SHALL open a sheet listing its kind’s settings with their current values, and each change SHALL send one configure intent with the region’s next settings; a kind with no settings SHALL offer no sheet.',
    name: 'Choosing which tracks the strips show',
    when: 'a person opens the track strips’ settings and unticks tracks until four of the eight are left',
    then: 'each change sends one configure intent, and once applied the strips show only those four',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'Track strips tools' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Track strips settings' }));
      const tracks = within(canvas.getByRole('group', { name: 'Tracks' }));
      for (const name of ['Gtr', 'Perc', 'Syn', 'FX']) await userEvent.click(tracks.getByRole('checkbox', { name }));
    },
    check: async ({ canvasElement }) => {
      const intents = JSON.parse(within(canvasElement).getByLabelText('Story: intents sent').textContent || '[]') as SurfaceIntent[];
      await expect(intents).toHaveLength(4);
      await expect(intents.at(-1)).toEqual({ type: 'configureRegion', tab: 'm', region: 'm-1', settings: { tracks: ['drums', 'bass', 'keys', 'vox'] } });
      await waitFor(() => expect(strips(canvasElement)).toEqual(['drums', 'bass', 'keys', 'vox']));
    },
  },
  { render: () => <Strips /> },
) as Story;

export const AKindWithoutSettings: Story = scenario(
  {
    requirement: 'The settings sheet edits a region’s settings',
    shall: 'A region’s tools SHALL open a sheet listing its kind’s settings with their current values, and each change SHALL send one configure intent with the region’s next settings; a kind with no settings SHALL offer no sheet.',
    name: 'A kind without settings',
    when: 'a person opens the tools of a region whose kind declares no settings',
    then: 'there is no settings button',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Rig health tools' }));
    },
    check: async ({ canvasElement }) => {
      await expect(LIVE_PANES.rig).not.toHaveProperty('settings');
      await expect(within(canvasElement).queryByRole('button', { name: 'Rig health settings' })).toBeNull();
      await expect(within(canvasElement).getByRole('button', { name: 'remove Rig health' })).toBeTruthy();
    },
  },
  { render: () => <Strips /> },
) as Story;

export const SeveralOfASetOfChoices: Story = scenario(
  {
    name: 'Several of a set of choices',
    when: 'a pane kind declares a setting that picks several of its options and a person ticks a second one in the settings sheet',
    then: 'one configure intent is sent with both values, in the options’ order',
    act: async ({ canvasElement }) => {
      onNotesIntent.mockClear();
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'Set notes tools' }));
      await userEvent.click(canvas.getByRole('button', { name: 'Set notes settings' }));
      await userEvent.click(within(canvas.getByRole('group', { name: 'Lists' })).getByRole('checkbox', { name: 'Guests' }));
    },
    check: async () => {
      await expect(sent().filter((i) => i.type === 'configureRegion')).toEqual([{ type: 'configureRegion', tab: 't', region: 'n', settings: { lists: ['cues', 'guests'] } }]);
    },
  },
  { render: () => <Workspace name="Notes" document={notesDoc()} panes={[LISTS]} targets={LIVE_TARGETS} editing onIntent={onNotesIntent} pane={() => <p>notes</p>} /> },
) as Story;

export const AnOptionThatIsGone: Story = scenario(
  {
    requirement: 'A value that no longer fits reads as the default',
    shall: 'A region’s value that its setting no longer allows SHALL reach the pane as the setting’s default (a choice that is no longer an option, a toggle that isn’t on or off, a number that isn’t one), a number outside its range SHALL reach it held to the range, a pick of several SHALL keep only the values still offered, and the document SHALL keep the value it holds until a person changes it.',
    name: 'An option that is gone',
    when: 'a region carries a text size its kind no longer offers, and a list that is no longer one of the options',
    then: 'the pane receives the default text size and only the lists still offered',
    check: async ({ canvasElement }) => {
      await expect(shown(canvasElement)).toMatchObject({ size: 'l', lists: ['keys'] });
    },
  },
  { render: () => <Workspace name="Notes" document={notesDoc({ size: 'huge', lists: ['keys', 'encores'] })} panes={[LISTS]} targets={LIVE_TARGETS} pane={(_r, _t, settings) => <pre data-testid="settings">{JSON.stringify(settings)}</pre>} /> },
) as Story;

export const ANumberOutOfRange: Story = scenario(
  {
    requirement: 'A value that no longer fits reads as the default',
    shall: 'A region’s value that its setting no longer allows SHALL reach the pane as the setting’s default (a choice that is no longer an option, a toggle that isn’t on or off, a number that isn’t one), a number outside its range SHALL reach it held to the range, a pick of several SHALL keep only the values still offered, and the document SHALL keep the value it holds until a person changes it.',
    name: 'A number out of range',
    when: 'a region carries forty lines for a setting that allows one to twelve, and a toggle that is neither on nor off',
    then: 'the pane receives twelve lines and the toggle’s default',
    and: ['the document still holds the forty'],
    check: async ({ canvasElement }) => {
      await expect(shown(canvasElement)).toMatchObject({ lines: 12, dim: false });
      await expect(notesDoc({ lines: 40, dim: 'maybe' }).tabs[0].regions[0].settings).toEqual({ lines: 40, dim: 'maybe' });
    },
  },
  { render: () => <Workspace name="Notes" document={notesDoc({ lines: 40, dim: 'maybe' })} panes={[LISTS]} targets={LIVE_TARGETS} pane={(_r, _t, settings) => <pre data-testid="settings">{JSON.stringify(settings)}</pre>} /> },
) as Story;
