import type { Meta, StoryObj } from '@storybook/react-vite';
import { scenario } from 'story-spec';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../../storybook';
import { Workspace } from '../../../../layouts/Workspace/Workspace';
import { workspacePane } from '../../../../layouts/Workspace/content.story';
import type { PaneDefinition, SurfaceDocument } from '../../../../layouts/Workspace/Workspace.types';
import { isLivePaneKind, livePanes } from '../../panes';
import { useLiveSet } from './LiveSet.story';
import { Strips, strips } from './Strips.story';
import { LIVE_DOCUMENT } from './views';

// The reference kit: the Music live panes as one ready-made set of pane definitions. The framework
// (the surface, its document, its intents, the host contract) names no particular pane; this is the
// kit an app may take whole, take in part, or put beside panes of its own. The whole DAWs composed
// from it are `Music/Live/DAWs` (daws/DAWs.stories.tsx). React only: region content is app content.

const meta = {
  title: 'Music/Live/Screens/Reference kit',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 1440, h: 900 },
    spec: {
      capability: 'live-reference-kit',
      purpose: 'The Music live panes as a ready-made set an app may use whole, in part or beside its own, the settings they declare, and the whole DAWs composed from them.',
      requirement: 'The Music live panes are a ready-made set',
      shall: 'Zen SHALL provide the Music live panes as one set of pane definitions an app may use whole, use in part, or combine with its own, and the live views SHALL be built from that set.',
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

function LiveOne() {
  const live = useLiveSet({ running: false });
  return <Workspace name="Hidden Signals" document={LIVE_DOCUMENT} panes={livePanes} selected={live.selected} pane={(region, target, settings) => <div data-testid={`pane-${region.id}`} data-kind={region.kind} style={{ height: '100%' }}>{live.content(region, target, settings)}</div>} />;
}

export const TheLiveViewsUseTheSet: Story = scenario(
  {
    name: 'The live views use the set',
    when: 'the ONE tab of the live views is opened',
    then: 'every region on it is a Music live pane drawn from the ready-made set',
    check: async ({ canvasElement }) => {
      const panes = [...canvasElement.querySelectorAll<HTMLElement>('[data-testid^="pane-"]')];
      await expect(panes.length).toBe(LIVE_DOCUMENT.tabs.find((t) => t.id === 'one')!.regions.length);
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
    name: 'An app mixes the set with its own',
    when: 'an app gives the surface the ready-made set plus one kind of its own',
    then: 'the palette lists every live pane and the app’s kind, and a tab can hold both',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'open the palette' }));
    },
    check: async ({ canvasElement }) => {
      const palette = within(within(canvasElement).getByRole('group', { name: 'Palette' }));
      await expect(palette.getAllByRole('button')).toHaveLength(livePanes.length + 1);
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
      pane={(region, target, settings) => (isLivePaneKind(region.kind) ? <div data-testid={`pane-${region.id}`} style={{ height: '100%' }}>{live.content(region, target, settings)}</div> : workspacePane(region, target))}
    />
  );
}

export const TheStripsFollowTheirSettings: Story = scenario(
  {
    requirement: 'The live panes declare their settings',
    shall: 'The Music live panes SHALL declare the settings their own props already allow (which tracks a pane shows, which pads or moves it offers), and a surface built from the set SHALL draw each pane from its region’s settings.',
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
