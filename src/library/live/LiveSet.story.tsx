// The stories' stand-in for the app: one live set's state, a running clock, and the content for
// every pane kind, linked (the selected track is the orbit ring, the spine and the Push column; a
// wedge picked on the compass overrides the chord the orbits follow). Story harness only: the
// panes themselves hold no state.
import { useMemo, useState, type ReactNode } from 'react';
import { fn } from 'storybook/test';
import { ArpSequencer } from '../components/music/ArpSequencer/ArpSequencer';
import { arpSequencerBoard } from '../components/music/ArpSequencer/ArpSequencer.fixtures';
import { ChordStrip } from '../components/music/ChordStrip/ChordStrip';
import type { LiveTrack } from '../components/music/live.model';
import { LoopGrid } from '../components/music/LoopGrid/LoopGrid';
import { loopBoard, loopSongs } from '../components/music/LoopGrid/LoopGrid.fixtures';
import { MacroPads } from '../components/music/MacroPads/MacroPads';
import { MACRO_PADS } from '../components/music/MacroPads/MacroPads.fixtures';
import { MixBand } from '../components/music/MixBand/MixBand';
import { mixBoard, mixReturns } from '../components/music/MixBand/MixBand.fixtures';
import { StemLanes } from '../components/music/StemLanes/StemLanes';
import { stemLanesBoard } from '../components/music/StemLanes/StemLanes.fixtures';
import { TransitionRow, type TransitionPad } from '../components/music/TransitionRow/TransitionRow';
import { transitionBoard } from '../components/music/TransitionRow/TransitionRow.fixtures';
import type { WorkspaceBinding } from '../layout/Workspace/Workspace.types';
import { Text } from '../primitives/Text';
import { useBeat } from './clock';
import { ChordCompass, type FollowMode } from './panes/ChordCompass/ChordCompass';
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
  type ChainStage,
  type LandingLength,
  type LandingTarget,
  type LoopLayer,
} from './set';
import { kindOf, PANE_KINDS } from './views';

/** The set's eight tracks: the grid's cells with the mixer's levels, meters, sends and lamps. */
export const LIVE_TRACKS: readonly LiveTrack[] = loopBoard.map((track, i) => {
  const strip = mixBoard[i % mixBoard.length];
  return { ...track, level: strip.level, meter: strip.meter, sends: strip.sends ?? [0, 0], muted: strip.muted, soloed: strip.soloed, armed: strip.armed, parked: strip.parked };
});

const TEMPO = 112;

/** An audio track's chain in the stand-in data: Keys's own, with its input swapped and no generator or instrument. */
const audioChain = (source: string): readonly ChainStage[] =>
  KEYS_CHAIN.map((s) => (s.id === 'input' ? { ...s, value: `audio · ${source}` } : s.id === 'gen' || s.id === 'inst' ? { ...s, bypass: true, params: undefined } : s.id === 'looper' ? { ...s, value: 'audio loop · 8 bars' } : s));

/** Where the progression is at `beat`: the chord's index and the beats until the next. */
function chordAt(beat: number): { index: number; toNext: number } {
  const lengths = SET_PROGRESSION.map((c) => c.beats ?? 4);
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  // Start where ChordStrip's fixture stands.
  const offset = lengths.slice(0, SET_CHORD_INDEX).reduce((a, b) => a + b, 0);
  let t = (((beat + offset) % total) + total) % total;
  for (let i = 0; i < lengths.length; i++) {
    if (t < lengths[i]) return { index: i, toNext: Math.max(1, Math.ceil(lengths[i] - t)) };
    t -= lengths[i];
  }
  return { index: 0, toNext: 1 };
}

/**
 * A region's faceplate tag: a caption chip over the pane's top-left corner, so every pane says
 * what it is (the Workspace stories' own). Overlaid, never laid out, so the solver's sizes hold.
 */
function face(label: string, children: ReactNode): ReactNode {
  return (
    <div className="lv-face">
      <Text role="caption" tone="muted" className="lv-face__tag">
        {label}
      </Text>
      {children}
    </div>
  );
}

export interface LiveSetOptions {
  /** Run the clock. Off for stories that hold a still frame. */
  running?: boolean;
  /** What each region is bound to, by region id: `{ track }` points a spine or orbit at a column. */
  bindings?: Record<string, WorkspaceBinding>;
}

/** The set's state and a function from a region id to its content. */
export function useLiveSet({ running = true, bindings = {} }: LiveSetOptions = {}) {
  const beat = useBeat(TEMPO, running, 2);
  const [selected, setSelected] = useState('keys');
  const [follow, setFollow] = useState<FollowMode>('prog');
  const [bassLock, setBassLock] = useState(true);
  const [target, setTarget] = useState<LandingTarget>('song');
  const [length, setLength] = useState<LandingLength>(8);
  const [held, setHeld] = useState<string | undefined>(undefined);
  const [scene, setScene] = useState(1);
  const [layers, setLayers] = useState<readonly LoopLayer[]>(KEYS_LAYERS);
  const [picked, setPicked] = useState<string | undefined>(undefined);

  const { index, toNext } = chordAt(beat);
  const chordName = picked ?? SET_PROGRESSION[index]?.name;
  const bar = Math.floor(beat / 4);
  const barsLeft = ((((SET_NOW.barsToCue - bar) % length) + length) % length) || length;
  const pads: TransitionPad[] = transitionBoard.map((p) => ({ ...p, state: p.id === 'riser' ? 'armed' : p.state }));

  const content = useMemo(() => {
    return (id: string, regionBindings: Record<string, WorkspaceBinding> = bindings): ReactNode => {
      const kind = kindOf(id);
      if (!kind) return null;
      const label = PANE_KINDS[kind].label;
      const bound = regionBindings[id]?.track;
      const trackId = bound ?? selected;
      const track = SET_TRACKS.find((t) => t.id === trackId) ?? SET_TRACKS[2];
      switch (kind) {
        case 'river':
          return face(label, <SetlistRiver songs={SET_SONGS} progress={SET_NOW.progress + (beat % 64) / 640} barsToCue={barsLeft} onPick={fn()} onScene={(s) => setScene(SET_SONGS[2].scenes?.findIndex((x) => x.id === s) ?? 0)} />);
        case 'compass':
          return face(
            label,
            <ChordCompass chords={SET_PROGRESSION} index={index} keyName="C" beatsToNext={toNext} follow={follow} onFollow={setFollow} bassLock={bassLock} onBassLock={setBassLock} onPick={(c) => setPicked((p) => (p === c ? undefined : c))} />,
          );
        case 'orbits':
          return face(label, <OrbitClock generators={SET_GENERATORS} tracks={SET_TRACKS} beat={beat} chaos={0.25} chord={chordName} selected={trackId} onSelect={setSelected} onMutate={fn()} onShake={fn()} onKeep={fn()} onRevert={() => setPicked(undefined)} />);
        case 'spine':
          return face(
            label,
            <SignalSpine
              track={track}
              chain={track.id === 'keys' ? KEYS_CHAIN : audioChain(track.source)}
              layers={layers}
              loopBars={8}
              beat={beat}
              outs={['Main L/R', 'IEM 2']}
              level={LIVE_TRACKS.find((t) => t.id === track.id)?.meter ?? 0.5}
              onPrev={() => setSelected(SET_TRACKS[(SET_TRACKS.findIndex((t) => t.id === track.id) + 7) % 8].id)}
              onNext={() => setSelected(SET_TRACKS[(SET_TRACKS.findIndex((t) => t.id === track.id) + 1) % 8].id)}
              onStage={fn()}
              onUndo={() => setLayers((l) => (l.length > 1 ? l.slice(0, -1) : l))}
              onMuteLayer={(lid) => setLayers((l) => l.map((x) => (x.id === lid ? { ...x, muted: !x.muted } : x)))}
            />,
          );
        case 'push':
          return face(
            label,
            <PushTwin
              tracks={LIVE_TRACKS}
              sections={PUSH_SECTIONS}
              section={1}
              queuedSection={2}
              transitions={PUSH_TRANSITIONS}
              held={held}
              scenes={['bed', '+bass', 'full', 'break', 'kept']}
              scene={scene}
              selected={selected}
              onPad={(p) => {
                if (p.row === 'transitions') setHeld((h) => (h === PUSH_TRANSITIONS[p.column] ? undefined : PUSH_TRANSITIONS[p.column]));
                else if (p.row === 'clips' || p.row === 'stop') setSelected(LIVE_TRACKS[p.column]?.id ?? selected);
              }}
              onScene={setScene}
            />,
          );
        case 'landing':
          return face(label, <LandingDial via="RISER" lands="Wire" landsHint="118 · G" hit="DROP" target={target} onTarget={setTarget} length={length} onLength={setLength} barsLeft={Math.min(barsLeft, length)} beat={beat} armed onCancel={fn()} />);
        case 'rig':
          return <RigHealth inputs={RIG_INPUTS} devices={RIG_DEVICES} load={RIG_LOAD} xruns={0} frames={64} quantize="1 bar" countIn="1 bar" onOpen={fn()} />;
        case 'loop':
          return face(label, <LoopGrid songs={loopSongs} tracks={LIVE_TRACKS} loop={{ phase: (beat % 32) / 32, bars: 8 }} selected={selected} onLaunch={fn()} onStop={fn()} onStopTrack={fn()} onSelectTrack={setSelected} onToggleSong={fn()} />);
        case 'mix':
          return face(label, <MixBand tracks={LIVE_TRACKS} sends={[...mixReturns]} selected={selected} onLevel={fn()} onSend={fn()} onReturn={fn()} onArm={fn()} onMute={fn()} onSolo={fn()} onSelect={setSelected} />);
        case 'follow':
          return face(label, <ChordStrip chords={[...SET_PROGRESSION]} index={index} onFollow={fn()} onMutate={fn()} onKeep={fn()} onRevert={() => setPicked(undefined)} />);
        case 'arp':
          return face(label, <ArpSequencer state={arpSequencerBoard.state!} chords={[...SET_PROGRESSION]} index={index} onStep={fn()} onState={fn()} />);
        case 'throws':
          return face(label, <MacroPads pads={[...MACRO_PADS]} onMove={fn()} />);
        case 'cuts':
          return face(label, <TransitionRow pads={pads} selected="riser" onFire={fn()} />);
        case 'stems':
          return face(label, <StemLanes {...stemLanesBoard} onCue={fn()} onToggle={fn()} />);
      }
    };
  }, [beat, bindings, selected, follow, bassLock, target, length, held, scene, layers, picked, index, toNext, chordName, barsLeft, pads]);

  return { beat, selected, setSelected, content };
}
