import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../storybook';
import { useBeat } from './clock';
import { LIVE_TRACKS } from './LiveSet.story';
import { ChordCompass } from './panes/ChordCompass/ChordCompass';
import { LandingDial } from './panes/LandingDial/LandingDial';
import { OrbitClock } from './panes/OrbitClock/OrbitClock';
import { PushTwin } from './panes/PushTwin/PushTwin';
import { RigHealth } from './panes/RigHealth/RigHealth';
import { SetlistRiver } from './panes/SetlistRiver/SetlistRiver';
import { SignalSpine } from './panes/SignalSpine/SignalSpine';
import {
  KEYS_CHAIN,
  KEYS_LAYERS,
  PUSH_SECTIONS,
  PUSH_TRANSITIONS,
  RIG_DEVICES,
  RIG_INPUTS,
  RIG_LOAD,
  SET_CHORD_INDEX,
  SET_GENERATORS,
  SET_NOW,
  SET_PROGRESSION,
  SET_SONGS,
  SET_TRACKS,
} from './set';
import './live.css';

// The concept panes one at a time, each in every form it declares. React-only sketches: each pane
// is one idea from the live-looper boards drawn a new way, sized by its own forms so a Workspace
// tab can place it anywhere (Live/Views).

/** A pane in a box of the given size, so its forms read as they would in a region. */
function Specimen({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  return (
    <div className="lv-specimen">
      <div className="lv-specimen__box" style={{ width: w, height: h } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

/** The spies the plays assert. */
const spy = { pick: fn(), follow: fn(), bassLock: fn(), song: fn(), scene: fn(), pad: fn(), sceneButton: fn() };

const meta = {
  title: 'Live/Panes',
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Chord compass, `wheel`: the circle of fifths with the progression's outline, the readout beside it. */
export const ChordCompassWheel: Story = {
  name: 'Chord compass · wheel',
  render: () => (
    <Specimen w={640} h={380}>
      <ChordCompass form="wheel" chords={SET_PROGRESSION} index={SET_CHORD_INDEX} keyName="C" beatsToNext={2} bassLock onPick={spy.pick} onFollow={spy.follow} onBassLock={spy.bassLock} />
    </Specimen>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'F' }));
    await expect(spy.pick).toHaveBeenCalledWith('F');
  },
};

/** Chord compass, `dial`: the wheel alone, the chord and the next one in its hub. */
export const ChordCompassDial: Story = {
  name: 'Chord compass · dial',
  render: () => (
    <Specimen w={300} h={300}>
      <ChordCompass form="dial" chords={SET_PROGRESSION} index={SET_CHORD_INDEX} keyName="C" />
    </Specimen>
  ),
};

function OrbitsLive({ form }: { form: 'full' | 'orbits' }) {
  const beat = useBeat(112);
  return <OrbitClock form={form} generators={SET_GENERATORS} tracks={SET_TRACKS} beat={beat} chaos={0.25} chord="G7" selected="bass" onSelect={fn()} onMutate={fn()} onShake={fn()} onKeep={fn()} onRevert={fn()} />;
}

/** Orbits, `full`: five generators on five cycle lengths, drifting apart and back; the list and dice beside. */
export const Orbits: Story = {
  name: 'Orbits · full',
  render: () => (
    <Specimen w={720} h={440}>
      <OrbitsLive form="full" />
    </Specimen>
  ),
};

/** Orbits, `orbits`: the rings alone, for a small region. */
export const OrbitsCompact: Story = {
  name: 'Orbits · rings only',
  render: () => (
    <Specimen w={320} h={320}>
      <OrbitsLive form="orbits" />
    </Specimen>
  ),
};

/** Orbits, still: a fixed beat, so the hands, the lit beads and "meet in" can be read exactly. */
export const OrbitsStill: Story = {
  name: 'Orbits · still frame',
  render: () => (
    <Specimen w={720} h={440}>
      <OrbitClock form="full" generators={SET_GENERATORS} tracks={SET_TRACKS} beat={5.25} chaos={0.6} chord="Cmaj7" selected="drums" />
    </Specimen>
  ),
};

/** Setlist river, `river`: the night by minutes under its tempo contour, the song now opened into scenes. */
export const River: Story = {
  name: 'Setlist river · river',
  render: () => (
    <Specimen w={1200} h={220}>
      <SetlistRiver form="river" songs={SET_SONGS} progress={SET_NOW.progress} barsToCue={SET_NOW.barsToCue} onPick={spy.song} onScene={spy.scene} />
    </Specimen>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Wire/ }));
    await expect(spy.song).toHaveBeenCalledWith('wire');
    await userEvent.click(canvas.getByRole('button', { name: 'full' }));
    await expect(spy.scene).toHaveBeenCalledWith('full');
  },
};

/** Setlist river, `strip`: one line of songs. */
export const RiverStrip: Story = {
  name: 'Setlist river · strip',
  render: () => (
    <Specimen w={900} h={64}>
      <SetlistRiver form="strip" songs={SET_SONGS} progress={SET_NOW.progress} barsToCue={SET_NOW.barsToCue} />
    </Specimen>
  ),
};

function SpineLive({ form }: { form: 'chain' | 'column' }) {
  const beat = useBeat(112);
  return <SignalSpine form={form} track={SET_TRACKS[2]} chain={KEYS_CHAIN} layers={KEYS_LAYERS} loopBars={8} beat={beat} outs={['Main L/R', 'IEM 2']} level={0.6} onPrev={fn()} onNext={fn()} onStage={fn()} onUndo={fn()} onMuteLayer={fn()} />;
}

/** Signal spine, `chain`: Keys as its path — input, arp, piano, the looper's tree rings, delay, out. */
export const Spine: Story = {
  name: 'Signal spine · chain',
  render: () => (
    <Specimen w={1280} h={360}>
      <SpineLive form="chain" />
    </Specimen>
  ),
};

/** Signal spine, `column`: the same path stacked, for a side column. */
export const SpineColumn: Story = {
  name: 'Signal spine · column',
  render: () => (
    <Specimen w={360} h={900}>
      <SpineLive form="column" />
    </Specimen>
  ),
};

/** Push twin, `full`: the scribble strip, the banded 8×8 and the scenes, lit as the hardware is. */
export const Push: Story = {
  name: 'Push twin · full',
  render: () => (
    <Specimen w={760} h={720}>
      <PushTwin
        form="full"
        tracks={LIVE_TRACKS}
        sections={PUSH_SECTIONS}
        section={1}
        queuedSection={2}
        transitions={PUSH_TRANSITIONS}
        held="HOLD A"
        scenes={['bed', '+bass', 'full', 'break', 'kept']}
        scene={1}
        selected="keys"
        onPad={spy.pad}
        onScene={spy.sceneButton}
      />
    </Specimen>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /^Transitions 2, DROP/ }));
    await expect(spy.pad).toHaveBeenCalledWith({ row: 'transitions', column: 1, slot: undefined });
  },
};

/** Push twin, `grid`: the pads alone. */
export const PushGrid: Story = {
  name: 'Push twin · grid',
  render: () => (
    <Specimen w={420} h={420}>
      <PushTwin form="grid" tracks={LIVE_TRACKS} sections={PUSH_SECTIONS} section={1} transitions={PUSH_TRANSITIONS} scenes={[]} />
    </Specimen>
  ),
};

function LandingLive({ form, armed = true }: { form: 'dial' | 'chip'; armed?: boolean }) {
  const beat = useBeat(112);
  const bars = 8 - (Math.floor(beat / 4) % 8);
  return <LandingDial form={form} via="RISER" lands="Wire" landsHint="118 · G" hit="DROP" target="song" onTarget={fn()} length={8} onLength={fn()} barsLeft={bars} beat={beat} armed={armed} onCancel={fn()} />;
}

/** Landing, `dial`: eight bars of riser counting down to Wire, the bar now filling beat by beat. */
export const Landing: Story = {
  name: 'Landing · dial',
  render: () => (
    <Specimen w={360} h={460}>
      <LandingLive form="dial" />
    </Specimen>
  ),
};

/** Landing, not armed: the ring dashed, nothing counting. */
export const LandingIdle: Story = {
  name: 'Landing · not armed',
  render: () => (
    <Specimen w={360} h={460}>
      <LandingLive form="dial" armed={false} />
    </Specimen>
  ),
};

/** Landing, `chip`: one line for a header or a footer. */
export const LandingChip: Story = {
  name: 'Landing · chip',
  render: () => (
    <Specimen w={320} h={56}>
      <LandingLive form="chip" />
    </Specimen>
  ),
};

/** Rig health, `strip`: quantize, inputs (Gtr low, Bass silent), controllers (footswitch gone), load. */
export const Rig: Story = {
  name: 'Rig health · strip',
  render: () => (
    <Specimen w={1280} h={52}>
      <RigHealth form="strip" inputs={RIG_INPUTS} devices={RIG_DEVICES} load={RIG_LOAD} xruns={0} frames={64} quantize="1 bar" countIn="1 bar" onOpen={fn()} />
    </Specimen>
  ),
};

/** Rig health, `dots`: the dots and the load only. */
export const RigDots: Story = {
  name: 'Rig health · dots',
  render: () => (
    <Specimen w={560} h={52}>
      <RigHealth form="dots" inputs={RIG_INPUTS} devices={RIG_DEVICES} load={RIG_LOAD} xruns={2} />
    </Specimen>
  ),
};
