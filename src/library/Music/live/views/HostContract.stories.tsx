import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { scenario } from 'story-spec';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../../storybook';
import { Workspace } from '../../../layout/Workspace/Workspace';
import type { SurfaceDocument } from '../../../layout/Workspace/Workspace.types';
import { DicePad, type DiceMove } from '../DicePad/DicePad';
import { LaunchGrid } from '../LaunchGrid/LaunchGrid';
import { launchSongs, launchTracks } from '../LaunchGrid/LaunchGrid.fixtures';
import type { LaunchTrack } from '../LaunchGrid/LaunchGrid.model';
import { LIVE_PANES } from '../panes';
import { RigHealth } from '../RigHealth/RigHealth';
import { rigHealthBoard } from '../RigHealth/RigHealth.fixtures';
import { StemDeck } from '../StemDeck/StemDeck';
import { deckMarkers, deckStems } from '../StemDeck/StemDeck.fixtures';
import { TrackStrips } from '../TrackStrips/TrackStrips';
import { stripReturns, stripTracks } from '../TrackStrips/TrackStrips.fixtures';

// The host contract: what a pane reads, what it asks for, and how the fast values reach it. Each
// story stands in for the app as briefly as the scenario needs: a pane drawn bare (no host), a
// host that applies what the pane asks, a surface whose regions are bound, a frame reader. React
// only: these are hosts, and every pane's own stories already play it in both renderers.

const meta = {
  title: 'Music/Live/Host contract',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'fullscreen',
    frame: { w: 1200, h: 640 },
    spec: {
      capability: 'live-host-contract',
      purpose: 'What a pane in a composed DAW reads from its host, what it asks for, and how values that change every frame reach it.',
      requirement: 'A pane draws what the host says',
      shall: 'A pane SHALL draw only the readings its host gives it (what is playing, queued, muted, selected or measured), and SHALL show a reading the host doesn’t give as missing rather than as a made-up value.',
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;


/** A launch grid whose host applies a launch by queueing the cell. */
function QueueingHost() {
  const [tracks, setTracks] = useState<readonly LaunchTrack[]>(launchTracks);
  return (
    <LaunchGrid
      songs={launchSongs}
      tracks={tracks}
      loop={{ phase: 0.5, bars: 8 }}
      selected="keys"
      onLaunch={({ track, cell }) => setTracks((all) => all.map((t) => (t.id === track ? { ...t, cells: t.cells.map((c) => (c.id === cell ? { ...c, state: 'queued' } : c)) } : t)))}
    />
  );
}

export const APressWithoutAHostChange: Story = scenario(
  {
    name: 'A press without a host change',
    when: 'a person launches a clip and the host doesn’t queue it',
    then: 'the clip still reads as it did before the press',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Keys Pad, stopped' }));
    },
    check: async ({ canvasElement }) => {
      await expect(within(canvasElement).getByRole('button', { name: 'Keys Pad, stopped' })).toBeTruthy();
      await expect(within(canvasElement).queryByRole('button', { name: /^Keys Pad, queued/ })).toBeNull();
    },
  },
  { render: () => <LaunchGrid songs={launchSongs} tracks={launchTracks} loop={{ phase: 0.5, bars: 8 }} selected="keys" onLaunch={fn()} /> },
) as Story;

export const TheHostConfirms: Story = scenario(
  {
    name: 'The host confirms',
    when: 'a person launches a clip and the host queues it',
    then: 'the clip reads queued',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Keys Pad, stopped' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(within(canvasElement).getByRole('button', { name: /^Keys Pad, queued/ })).toBeTruthy());
    },
  },
  { render: () => <QueueingHost /> },
) as Story;

export const AMeasurementTheHostDoesntGive: Story = scenario(
  {
    name: 'A measurement the host doesn’t give',
    when: 'the host gives no DSP load',
    then: 'the pane shows the load as missing, not as zero',
    check: async ({ canvasElement }) => {
      await expect(canvasElement.textContent).toMatch(/cpu —/);
      await expect(canvasElement.textContent).not.toMatch(/cpu 0%/);
    },
  },
  { render: () => <RigHealth {...rigHealthBoard} load={[]} /> },
) as Story;

const DICE_DOC = (binding: SurfaceDocument['tabs'][number]['regions'][number]['binding']): SurfaceDocument => ({
  version: 1,
  active: 'hands',
  tabs: [{ id: 'hands', title: 'Hands', rows: [['hands-1']], regions: [{ id: 'hands-1', kind: 'dice', title: 'Dice pad', binding }] }],
});
const TRACK_NAMES: Record<string, string> = { drums: 'Drums', bass: 'Bass', keys: 'Keys' };

/** An app with one dice pad on its surface: it aims each move at the target the region resolves to. */
function DiceApp({ document }: { document: SurfaceDocument }) {
  const [selected, setSelected] = useState('keys');
  const [asked, setAsked] = useState<{ move: DiceMove; track: string | undefined }[]>([]);
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', height: '100%' }}>
      <div role="group" aria-label="Story: the app’s selection">
        {Object.entries(TRACK_NAMES).map(([id, name]) => (
          <button key={id} type="button" aria-pressed={selected === id} onClick={() => setSelected(id)}>
            Select {name}
          </button>
        ))}
      </div>
      <output aria-label="Story: intents asked">{JSON.stringify(asked)}</output>
      <Workspace
        name="Rig"
        document={document}
        panes={[LIVE_PANES.dice]}
        selected={selected}
        pane={(_region, target) => <DicePad target={target ? TRACK_NAMES[target] : undefined} onDice={(move) => setAsked((all) => [...all, { move, track: target }])} />}
      />
    </div>
  );
}

const asked = (el: HTMLElement): unknown => JSON.parse(within(el).getByLabelText('Story: intents asked').textContent || '[]');

export const ABoundRegionAsksForItsTarget: Story = scenario(
  {
    requirement: 'A pane asks with one intent per gesture',
    shall: 'A pane SHALL turn each discrete gesture (a press, a pick, a toggle) into one named intent with one plain-data argument (an id, a reference such as a track and cell, or a 0–1 value), and a continuous gesture (a drag) into one such intent per step, each aimed at the target its region is bound to, and SHALL send nothing more once its region is removed mid-gesture.',
    name: 'A bound region asks for its target',
    when: 'a region fixed to the second track is pressed',
    then: 'its intent names the second track whatever track is selected',
    act: async ({ canvasElement }) => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'MUTATE, Bass' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(asked(canvasElement)).toEqual([{ move: 'mutate', track: 'bass' }]));
    },
  },
  { render: () => <DiceApp document={DICE_DOC({ mode: 'fixed', target: 'bass' })} /> },
) as Story;

export const FollowingTheSelection: Story = scenario(
  {
    requirement: 'A pane asks with one intent per gesture',
    shall: 'A pane SHALL turn each discrete gesture (a press, a pick, a toggle) into one named intent with one plain-data argument (an id, a reference such as a track and cell, or a 0–1 value), and a continuous gesture (a drag) into one such intent per step, each aimed at the target its region is bound to, and SHALL send nothing more once its region is removed mid-gesture.',
    name: 'Following the selection',
    when: 'a region bound to the selected track is pressed after the selection changes',
    then: 'its intent names the newly selected track',
    act: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole('button', { name: 'Select Drums' }));
      await userEvent.click(await canvas.findByRole('button', { name: 'MUTATE, Drums' }));
    },
    check: async ({ canvasElement }) => {
      await waitFor(() => expect(asked(canvasElement)).toEqual([{ move: 'mutate', track: 'drums' }]));
    },
  },
  { render: () => <DiceApp document={DICE_DOC({ mode: 'selected' })} /> },
) as Story;

/** Track strips the story can remove mid-gesture. */
function RemovableStrips({ onLevel }: { onLevel: (change: { track: string; level: number }) => void }) {
  const [mounted, setMounted] = useState(true);
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <button type="button" onClick={() => setMounted((m) => !m)}>
        {mounted ? 'Story: remove the region' : 'Story: put it back'}
      </button>
      {mounted ? <TrackStrips tracks={stripTracks} returns={stripReturns} onLevel={onLevel} /> : null}
    </div>
  );
}

const onLevelSpy = fn();

export const ADragCutOffByRemoval: Story = scenario(
  {
    requirement: 'A pane asks with one intent per gesture',
    shall: 'A pane SHALL turn each discrete gesture (a press, a pick, a toggle) into one named intent with one plain-data argument (an id, a reference such as a track and cell, or a 0–1 value), and a continuous gesture (a drag) into one such intent per step, each aimed at the target its region is bound to, and SHALL send nothing more once its region is removed mid-gesture.',
    name: 'A drag cut off by removal',
    when: 'a region is removed while a fader in it is being dragged',
    then: 'no further intent arrives from that drag',
    act: async ({ canvasElement }) => {
      onLevelSpy.mockClear();
      const canvas = within(canvasElement);
      const drums = canvas.getByRole('slider', { name: 'Drums level' });
      await fireEvent.pointerDown(drums, { pointerId: 7, button: 0, clientX: 10, clientY: 200 });
      await fireEvent.pointerMove(drums, { pointerId: 7, clientX: 10, clientY: 150 });
      await waitFor(() => expect(onLevelSpy).toHaveBeenCalled());
      (canvasElement as HTMLElement & { calls?: number }).calls = onLevelSpy.mock.calls.length;
      await userEvent.click(canvas.getByRole('button', { name: 'Story: remove the region' }));
      await waitFor(() => expect(canvas.queryByRole('slider', { name: 'Drums level' })).toBeNull());
      await fireEvent.pointerMove(drums, { pointerId: 7, clientX: 10, clientY: 100 });
      await fireEvent.pointerMove(window, { pointerId: 7, clientX: 10, clientY: 60 });
      await fireEvent.pointerUp(window, { pointerId: 7 });
    },
    check: async ({ canvasElement }) => {
      await expect(onLevelSpy).toHaveBeenCalledTimes((canvasElement as HTMLElement & { calls?: number }).calls!);
    },
  },
  { render: () => <RemovableStrips onLevel={onLevelSpy} /> },
) as Story;

/** A host that renders once and hands the strips a frame reader whose levels move with time. */
function FramedStrips() {
  const renders = useRef(0);
  renders.current += 1;
  const [readFrame] = useState(() => () => {
    const t = performance.now() / 300;
    return { levels: Object.fromEntries(stripTracks.map((s, i) => [s.id, 0.5 + 0.45 * Math.sin(t + i)])) };
  });
  return (
    <div data-renders={renders.current} style={{ height: '100%' }}>
      <TrackStrips tracks={stripTracks.map(({ meter: _meter, ...s }) => s)} returns={stripReturns} readFrame={readFrame} />
    </div>
  );
}

export const MetersMoveOnTheFrame: Story = scenario(
  {
    requirement: 'Fast values are read by the parts that draw them',
    shall: 'The host SHALL be able to give a pane a frame reader for values that change every frame (meters, playheads, beat), and only the leaf parts that draw those values SHALL read it, each animation frame, without the rest of the pane drawing again.',
    name: 'Meters move on the frame',
    when: 'the host’s frame reader reports new levels on each frame',
    then: 'the meters follow them while the pane’s other parts are not redrawn',
    check: async ({ canvasElement }) => {
      const meter = within(canvasElement).getByRole('meter', { name: 'Drums meter' });
      const fader = within(canvasElement).getByRole('slider', { name: 'Drums level' });
      const readings = new Set<string | null>();
      for (let i = 0; i < 6; i++) {
        readings.add(meter.getAttribute('aria-valuenow'));
        await new Promise((r) => setTimeout(r, 120));
      }
      await expect(readings.size).toBeGreaterThan(1);
      // The host drew once; the fader is the same element it was.
      await expect(canvasElement.querySelector('[data-renders]')).toHaveAttribute('data-renders', '1');
      await expect(within(canvasElement).getByRole('slider', { name: 'Drums level' })).toBe(fader);
    },
  },
  { render: () => <FramedStrips /> },
) as Story;

export const NoFrameReaderAndNoMeasurement: Story = scenario(
  {
    requirement: 'Fast values are read by the parts that draw them',
    shall: 'The host SHALL be able to give a pane a frame reader for values that change every frame (meters, playheads, beat), and only the leaf parts that draw those values SHALL read it, each animation frame, without the rest of the pane drawing again.',
    name: 'No frame reader and no measurement',
    when: 'a pane is given no frame reader and no measured level or position',
    then: 'its meters and playhead are not drawn, and the rest of the pane is',
    check: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(canvas.queryAllByRole('meter')).toHaveLength(0);
      await expect(canvas.getAllByRole('slider', { name: / level$/ }).length).toBeGreaterThanOrEqual(4);
      await expect(canvasElement.querySelector('.live-stems-playhead')).toBeNull();
      await expect(canvasElement.querySelectorAll('.live-stems-lane').length).toBe(deckStems.length);
    },
  },
  {
    render: () => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
        <TrackStrips tracks={stripTracks.map(({ meter: _meter, ...s }) => s)} returns={stripReturns} />
        <StemDeck title="Hidden Signals" sub="112 · Am" stems={deckStems} markers={deckMarkers} />
      </div>
    ),
  },
) as Story;

/** A host that gives the stem deck its playhead through the frame. */
export const PlayheadOnTheFrame: Story = {
  render: () => {
    const start = performance.now();
    return <StemDeck title="Hidden Signals" sub="112 · Am" stems={deckStems} markers={deckMarkers} readFrame={() => ({ position: ((performance.now() - start) / 20000) % 1 })} />;
  },
  play: async ({ canvasElement }) => {
    const head = canvasElement.querySelector<HTMLElement>('.live-stems-playhead')!;
    await waitFor(() => expect(head.hidden).toBe(false));
    const at = head.style.getPropertyValue('--live-stems-at');
    await waitFor(() => expect(head.style.getPropertyValue('--live-stems-at')).not.toBe(at));
  },
};
