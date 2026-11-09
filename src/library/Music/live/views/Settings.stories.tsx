import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { Workspace } from '../../../layout/Workspace/Workspace';
import { useSurfaceHost } from '../../../layout/Workspace/host.story';
import type { PaneDefinition, SurfaceDocument, SurfaceIntent } from '../../../layout/Workspace/Workspace.types';
import { LIVE_PANES, livePanes } from '../panes';
import { useLiveSet } from './LiveSet.story';
import { LIVE_TARGETS } from './Views.stories';

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
      shall: 'A pane definition SHALL be able to declare settings as plain data, each a choice, a toggle, a number in a range or a pick of the app’s targets, with a label and a default, and a region SHALL carry its own values for them in the document.',
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

/** The live set with one strips region, its settings applied by the host. */
function Strips({ settings }: { settings?: Record<string, readonly string[]> }) {
  const doc: SurfaceDocument = {
    version: 2,
    active: 'm',
    tabs: [
      {
        id: 'm',
        title: 'Mix',
        layout: { id: 'm-col', split: 'column', children: [{ node: 'm-1', share: 4 }, { node: 'm-2', share: 1 }] },
        regions: [
          { id: 'm-1', kind: 'mix', title: 'Track strips', binding: { mode: 'selected' }, ...(settings ? { settings } : {}) },
          { id: 'm-2', kind: 'rig', title: 'Rig health', binding: { mode: 'selected' } },
        ],
      },
    ],
  };
  const host = useSurfaceHost(doc, { keepEditing: true, editing: settings === undefined });
  const live = useLiveSet({ running: false });
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <output aria-label="Story: intents sent">{JSON.stringify(host.intents.filter((i) => i.type === 'configureRegion'))}</output>
      <Workspace name="Mix" document={host.document} panes={livePanes} targets={LIVE_TARGETS} editing={host.editing} onIntent={host.onIntent} pane={(r, t, s) => live.content(r, t, s)} />
    </div>
  );
}
const strips = (el: HTMLElement): string[] => [...el.querySelectorAll<HTMLElement>('.live-track-strips [data-track]')].map((s) => s.dataset.track!);

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

export const TheStripsFollowTheirSettings: Story = scenario(
  {
    requirement: 'The live panes declare their settings',
    shall: 'The Music live panes SHALL declare the settings their own props already allow (which tracks a pane shows, which pads or moves it offers), and the live views SHALL draw each pane from its region’s settings.',
    name: 'The strips follow their settings',
    when: 'a track strips region’s settings name two tracks',
    then: 'the strips draw those two tracks and their returns, and nothing else',
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(strips(canvasElement)).toEqual(['bass', 'vox']));
      await expect(canvasElement.querySelectorAll('.live-track-strips [data-return]').length).toBeGreaterThan(0);
    },
  },
  { render: () => <Strips settings={{ tracks: ['bass', 'vox'] }} /> },
) as Story;
