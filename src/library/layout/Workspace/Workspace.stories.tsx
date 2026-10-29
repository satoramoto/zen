import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { fixtureStories, withRenderer } from '../../stories/story';
import { ArpSequencer } from '../../components/music/ArpSequencer/ArpSequencer';
import { arpSequencerBoard } from '../../components/music/ArpSequencer/ArpSequencer.fixtures';
import { ChordStrip } from '../../components/music/ChordStrip/ChordStrip';
import { chordStripBoard } from '../../components/music/ChordStrip/ChordStrip.fixtures';
import type { LiveTrack } from '../../components/music/live.model';
import { LoopGrid } from '../../components/music/LoopGrid/LoopGrid';
import { loopBoard, loopSongs } from '../../components/music/LoopGrid/LoopGrid.fixtures';
import { MacroPads } from '../../components/music/MacroPads/MacroPads';
import { MACRO_PADS } from '../../components/music/MacroPads/MacroPads.fixtures';
import { MixBand } from '../../components/music/MixBand/MixBand';
import { mixBoard, mixReturns } from '../../components/music/MixBand/MixBand.fixtures';
import { StemLanes } from '../../components/music/StemLanes/StemLanes';
import { stemLanesBoard } from '../../components/music/StemLanes/StemLanes.fixtures';
import { TransitionRow } from '../../components/music/TransitionRow/TransitionRow';
import { transitionBoard } from '../../components/music/TransitionRow/TransitionRow.fixtures';
import { Workspace } from './Workspace';
import WorkspaceSvelte from './Workspace.svelte';
import { Text } from '../../primitives/Text';
import { liveTabs, workspaceArgTypes, workspaceStories as s } from './Workspace.fixtures';

// The Lemur views: five tabs of the same live set, each region holding the real widget, the data
// linked across them (the grid's tracks are the mixer's strips; the arp follows the strip's
// progression). Views are React-only renders (`render`, so the toolbar's Renderer leaves them on
// React): region content is app content, and only the component stories exercise both renderers.

/** The set's eight tracks: the grid's cells with the mixer's levels, meters, sends and lamps. */
const tracks: readonly LiveTrack[] = loopBoard.map((track, i) => {
  const strip = mixBoard[i % mixBoard.length];
  return { ...track, level: strip.level, meter: strip.meter, sends: strip.sends ?? [0, 0], muted: strip.muted, soloed: strip.soloed, armed: strip.armed, parked: strip.parked };
});

/**
 * A region's faceplate tag: a floating caption chip so every region says what it is, Bitwig's
 * device header strip reduced to a word. Overlaid, never laid out, so the solver's heights stay
 * exact; solid enough to read over the widget's top-left corner.
 */
function face(label: string, children: ReactNode): ReactNode {
  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0 }}>
      <Text
        role="caption"
        tone="muted"
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-control)',
          padding: '0 var(--space-1)',
        }}
      >
        {label}
      </Text>
      {children}
    </div>
  );
}

/** Every region's widget, wired to spies the views don't assert (the plays assert the workspace). */
const content: Record<string, ReactNode> = {
  loop: face(
    'Loop grid',
    <LoopGrid
      songs={loopSongs}
      tracks={tracks}
      loop={{ phase: 0.5, bars: 8 }}
      selected="keys"
      onLaunch={fn()}
      onStop={fn()}
      onStopTrack={fn()}
      onSelectTrack={fn()}
      onToggleSong={fn()}
    />
  ),
  mix: face(
    'Mix',
    <MixBand
      tracks={tracks}
      sends={[...mixReturns]}
      selected="keys"
      onLevel={fn()}
      onSend={fn()}
      onReturn={fn()}
      onArm={fn()}
      onMute={fn()}
      onSolo={fn()}
      onSelect={fn()}
    />
  ),
  follow: face(
    'Follow',
    <ChordStrip chords={[...(chordStripBoard.chords ?? [])]} index={chordStripBoard.index ?? 2} onFollow={fn()} onMutate={fn()} onKeep={fn()} onRevert={fn()} />
  ),
  keys: face(
    'Arp',
    <ArpSequencer
      state={arpSequencerBoard.state!}
      chords={[...(arpSequencerBoard.chords ?? [])]}
      index={arpSequencerBoard.index ?? 0}
      onStep={fn()}
      onState={fn()}
    />
  ),
  pads: face(
    'Throws',
    <MacroPads pads={[...MACRO_PADS]} onMove={fn()} />
  ),
  cuts: face(
    'Transitions',
    <TransitionRow pads={[...transitionBoard]} selected="drop" onFire={fn()} />
  ),
  stems: face(
    'Stems',
    <StemLanes {...stemLanesBoard} onCue={fn()} onToggle={fn()} />
  ),
};

/**
 * Five Lemur tabs over one setlist: a persistent strip, the open tab beneath it, and — while
 * editing — a frame round every region with the six structural edits. Live's geography
 * (tracks as columns, stops under the grid, mixer below, returns right) and Bitwig's
 * progress-in-the-clip and Remote Controls pages are the references; the pies, the hinge and the
 * tabs are this surface's own.
 */
const meta = {
  title: 'Design OS/Layout/Workspace',
  component: Workspace,
  decorators: [withRenderer, withStoryFrame, withLibraryTheme],
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', frame: { w: 1440, h: 900 } },
  args: { name: 'Live', workspace: { tabs: [...liveTabs] }, active: 'stage' },
  argTypes: workspaceArgTypes,
} satisfies Meta<typeof Workspace>;

export default meta;
type Story = StoryObj<typeof meta>;
const story = fixtureStories<Story>(Workspace, WorkspaceSvelte);

/**
 * A view: the fixture's workspace with every callback a spy, the regions holding the real
 * widgets. React-only: region content is app content, so the toolbar's Renderer stays on React.
 */
const view = (fixture: Parameters<typeof story>[0], active: string, extra: Partial<Story> = {}): Story => ({
  ...story(fixture, {
    ...extra,
    args: { ...fixture.args, active, onTab: fn(), onSpec: fn(), onBinding: fn() },
    render: (args) => <Workspace {...args} content={content} />,
  }),
});

/** Session grid: the set the way Live lays it — folded songs, eight columns, stops underneath. */
export const Session: Story = view(s.Perform, 'grid', {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'My stage' }));
    await expect(args.onTab).toHaveBeenCalledWith('stage');
  },
});

/** My stage: the loop grid over the mix beside the arp — the bento the mockups open on. */
export const Stage: Story = view(s.Perform, 'stage', {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Arp & follow' }));
    await expect(args.onTab).toHaveBeenCalledWith('arp');
  },
});

/** Arp & follow: the progression strip over the 16-step chord arp beside the macro throws. */
export const ArpFollow: Story = view(s.Perform, 'arp');

/** Mix & sends: the column-aligned band, returns right — Live's mixer below the grid. */
export const MixSends: Story = view(s.Perform, 'mix');

/** Stem deck: four lanes, hot cues and the loop window, transitions underneath. */
export const Stems: Story = view(s.Perform, 'stems');

/** Edit mode: every region framed — move, split, remove, add from the palette, bind a track. */
export const Edit: Story = {
  ...story(s.Edit, {
    args: {
      ...s.Edit.args,
      active: 'stage',
      onTab: fn(),
      onSpec: fn(),
      onBinding: fn(),
    },
    render: (args) => <Workspace {...args} content={content} />,
  }),
};

/** The palette bar adds a kind to the tab's last row. */
export const AddFromPalette: Story = {
  ...story(s.Edit, {
    args: { ...s.Edit.args, active: 'stage', onTab: fn(), onSpec: fn(), onBinding: fn() },
    render: (args) => <Workspace {...args} content={content} />,
    play: async ({ args, canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'add Transitions to this tab' }));
      await expect(args.onSpec).toHaveBeenCalled();
      const [, , why] = (args.onSpec as unknown as { mock: { calls: [string, unknown, string][] } }).mock.calls[0];
      await expect(why).toBe('add');
    },
  }),
};

/** A frame's arrow moves its region within its row. */
export const Reorder: Story = {
  ...story(s.Edit, {
    args: { ...s.Edit.args, active: 'stage', onTab: fn(), onSpec: fn(), onBinding: fn() },
    render: (args) => <Workspace {...args} content={content} />,
    play: async ({ args, canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'move arp left' }));
      await expect(args.onSpec).toHaveBeenCalled();
      const [tabId, , why] = (args.onSpec as unknown as { mock: { calls: [string, unknown, string][] } }).mock.calls[0];
      await expect(tabId).toBe('stage');
      await expect(why).toBe('move');
    },
  }),
};

/** A frame's `+ kind` splits its slot with the new region. */
export const Split: Story = {
  ...story(s.Edit, {
    args: { ...s.Edit.args, active: 'stage', onTab: fn(), onSpec: fn(), onBinding: fn() },
    render: (args) => <Workspace {...args} content={content} />,
    play: async ({ args, canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'split loop with Transitions' }));
      await expect(args.onSpec).toHaveBeenCalled();
      const [, , why] = (args.onSpec as unknown as { mock: { calls: [string, unknown, string][] } }).mock.calls[0];
      await expect(why).toBe('split');
    },
  }),
};

/** A frame's track switch binds its region. */
export const Bind: Story = {
  ...story(s.Edit, {
    args: { ...s.Edit.args, active: 'stage', onTab: fn(), onSpec: fn(), onBinding: fn() },
    render: (args) => <Workspace {...args} content={content} />,
    play: async ({ args, canvasElement }) => {
      const canvas = within(canvasElement);
      const group = canvas.getByRole('group', { name: 'Bind loop' });
      await userEvent.click(within(group).getByRole('button', { name: 'Keys' }));
      await expect(args.onBinding).toHaveBeenCalledWith('stage', 'loop', { track: 'keys' });
    },
  }),
};

/** My stage at 900 × 700: the tabs step down and nothing overflows. */
export const Narrow: Story = {
  ...story(s.Narrow, {
    args: { ...s.Narrow.args, active: 'stage', onTab: fn(), onSpec: fn(), onBinding: fn() },
    parameters: { frame: { w: 900, h: 700 } },
    render: (args) => <Workspace {...args} content={content} />,
  }),
};

/** No tabs: the strip alone. */
export const Empty: Story = story(s.Empty);

/** Drawn but deaf: dimmed, tools inert. */
export const Disabled: Story = story(s.Disabled, {
  args: { ...s.Disabled.args },
  render: (args) => <Workspace {...args} content={content} />,
});
