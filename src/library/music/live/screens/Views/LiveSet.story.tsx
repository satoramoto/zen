// The stories' stand-in for the app: one live set's state, a running clock, and the content for
// every region instance, by the pane kind it names and the target the Workspace resolved, all Music-family panes in mix[flow]'s face and
// linked (the selected track is the grid's column, the strip, the orbit ring, the spine and the
// Push column; a compass wedge overrides the chord the orbits follow). A region bound to a fixed
// track shows that track whatever is selected. Story harness only: the panes hold no state, and
// the clock, the queue and the stems' mutes here are scenario data, not a scheduler or an engine.
import { useMemo, useState, type ReactNode } from 'react';
import { fn } from 'storybook/test';
import { ChordCompass, type FollowMode } from '../../components/ChordCompass/ChordCompass';
import { compassProgression } from '../../components/ChordCompass/ChordCompass.fixtures';
import { CutPads, type CutPad } from '../../components/CutPads/CutPads';
import { cutPadsBoard } from '../../components/CutPads/CutPads.fixtures';
import { LandingDial, type LandingLength, type LandingTarget } from '../../components/LandingDial/LandingDial';
import { LaunchGrid } from '../../components/LaunchGrid/LaunchGrid';
import { launchSongs, launchTracks } from '../../components/LaunchGrid/LaunchGrid.fixtures';
import { OrbitClock } from '../../components/OrbitClock/OrbitClock';
import { orbitGenerators, orbitTracks } from '../../components/OrbitClock/OrbitClock.fixtures';
import { ProgressionStrip, type ProgressionFollow } from '../../components/ProgressionStrip/ProgressionStrip';
import { progressionChords } from '../../components/ProgressionStrip/ProgressionStrip.fixtures';
import { PushTwin } from '../../components/PushTwin/PushTwin';
import { pushScenes, pushSections, pushTracks, pushTransitions } from '../../components/PushTwin/PushTwin.fixtures';
import { RigHealth } from '../../components/RigHealth/RigHealth';
import { DicePad, type ScaleLock } from '../../components/DicePad/DicePad';
import { SectionBar } from '../../components/SectionBar/SectionBar';
import { SongCard } from '../../components/SongCard/SongCard';
import { songSections } from '../../components/SectionBar/SectionBar.fixtures';
import { StemDeck, type DeckStem } from '../../components/StemDeck/StemDeck';
import { deckMarkers, deckStems } from '../../components/StemDeck/StemDeck.fixtures';
import { rigHealthBoard } from '../../components/RigHealth/RigHealth.fixtures';
import { SetlistRiver } from '../../components/SetlistRiver/SetlistRiver';
import { riverSongs } from '../../components/SetlistRiver/SetlistRiver.fixtures';
import { SignalSpine, type SpineLayer, type SpineStage } from '../../components/SignalSpine/SignalSpine';
import { keysChain, keysLayers, spineTracks } from '../../components/SignalSpine/SignalSpine.fixtures';
import { ThrowPads, type ThrowPad } from '../../components/ThrowPads/ThrowPads';
import { throwPads } from '../../components/ThrowPads/ThrowPads.fixtures';
import { TrackStrips, type TrackStrip } from '../../components/TrackStrips/TrackStrips';
import { stripReturns, stripTracks } from '../../components/TrackStrips/TrackStrips.fixtures';
import { useBeat } from './clock';
import { ControlPanel, type ControlCell } from '../../layouts/ControlPanel/ControlPanel';
import { controlParams, controlValues } from '../../layouts/ControlPanel/ControlPanel.fixtures';
import type { ResolvedSettings, SurfaceRegion } from '../../../../layouts/Workspace/Workspace.types';
import type { DiceMove } from '../../components/DicePad/DicePad';

/** The set's tempo: Hidden Signals. */
export const TEMPO = 112;

/** The bars until Wire lands, at the start of the story. */
const CUE_BARS = 6;

/** Where the progression is at `beat`: the chord's index and the beats until the next. */
function chordAt(beat: number): { index: number; toNext: number } {
  const lengths = compassProgression.map((c) => c.beats ?? 4);
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  // Start where the fixtures stand (G7, the third chord).
  const offset = lengths.slice(0, 2).reduce((a, b) => a + b, 0);
  let t = (((beat + offset) % total) + total) % total;
  for (let i = 0; i < lengths.length; i++) {
    if (t < lengths[i]) return { index: i, toNext: Math.max(1, Math.ceil(lengths[i] - t)) };
    t -= lengths[i];
  }
  return { index: 0, toNext: 1 };
}

/** An audio track's chain in the stand-in data: Keys's own, its input swapped and no generator or instrument. */
const audioChain = (source: string): readonly SpineStage[] =>
  keysChain.map((s) =>
    s.id === 'input' ? { ...s, value: `audio · ${source}` } : s.id === 'gen' || s.id === 'inst' ? { ...s, bypass: true, params: undefined } : s.id === 'looper' ? { ...s, value: 'audio loop · 8 bars' } : s,
  );

export interface LiveSetOptions {
  /** Run the clock. Off for stories that hold a still frame. */
  running?: boolean;
}

/** The set's state, and a function from a region instance to its pane. */
export function useLiveSet({ running = true }: LiveSetOptions = {}) {
  const beat = useBeat(TEMPO, running, 2);
  const [selected, setSelected] = useState('keys');
  const [follow, setFollow] = useState<FollowMode>('prog');
  const [loopFollow, setLoopFollow] = useState<ProgressionFollow>('loop');
  const [bassLock, setBassLock] = useState(true);
  const [target, setTarget] = useState<LandingTarget>('song');
  const [length, setLength] = useState<LandingLength>(8);
  const [held, setHeld] = useState<string | undefined>(undefined);
  const [scene, setScene] = useState(1);
  const [layers, setLayers] = useState<readonly SpineLayer[]>(keysLayers);
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const [strips, setStrips] = useState<readonly TrackStrip[]>(stripTracks);
  const [throws, setThrows] = useState<readonly ThrowPad[]>(throwPads);
  const [queuedSection, setQueuedSection] = useState<string | undefined>('chorus');
  const [stems, setStems] = useState<readonly DeckStem[]>(deckStems);
  const [jam, setJam] = useState(false);
  const [scaleLock, setScaleLock] = useState<ScaleLock>('chord');
  const [chaos, setChaos] = useState(0.25);
  // The controls' parameters and MIDI learn, as the app keeps them: values, learn mode, the parameter waited on, the mappings.
  const [values, setValues] = useState<Readonly<Record<string, number>>>(controlValues);
  const [learning, setLearning] = useState(false);
  const [learnTarget, setLearnTarget] = useState<string | undefined>(undefined);
  const [mappings, setMappings] = useState<Readonly<Record<string, string>>>({});
  // The parameters a hand is on now: what an app would group into one undo step, or write automation for.
  const [touched, setTouched] = useState<readonly string[]>([]);
  const [cuts, setCuts] = useState<readonly CutPad[]>(cutPadsBoard.map((p) => (p.id === 'riser' ? { ...p, state: 'armed' } : p)));

  const { index, toNext } = chordAt(beat);
  const chordName = picked ?? compassProgression[index]?.name;
  const bar = Math.floor(beat / 4);
  const barsLeft = (((CUE_BARS - bar) % length) + length) % length || length;
  const step = (id: string, by: number) => {
    const i = spineTracks.findIndex((t) => t.id === id);
    setSelected(spineTracks[(i + by + spineTracks.length) % spineTracks.length].id);
  };

  const content = useMemo(() => {
    return (region: SurfaceRegion, bound?: string, settings: ResolvedSettings = {}, configure?: (next: ResolvedSettings) => void): ReactNode => {
      const trackId = bound ?? selected;
      // What the region's settings pick of the set: its tracks, its cuts, its moves (all when unset).
      const picks = (key: string): readonly string[] | undefined => (Array.isArray(settings[key]) ? (settings[key] as readonly string[]) : undefined);
      const only = <T extends { id: string }>(all: readonly T[], key: string): readonly T[] => {
        const ids = picks(key);
        return ids ? all.filter((x) => ids.includes(x.id)) : all;
      };
      const track = spineTracks.find((t) => t.id === trackId) ?? spineTracks[2];
      switch (region.kind) {
        case 'river':
          return <SetlistRiver songs={riverSongs} progress={0.38 + (beat % 64) / 640} barsToCue={barsLeft} onPick={fn()} onScene={(s) => setScene(Math.max(0, ['bed', 'bass', 'full', 'break', 'kept'].indexOf(s)))} />;
        case 'loop':
          return <LaunchGrid songs={launchSongs} tracks={only(launchTracks, 'tracks')} loop={{ phase: (beat % 32) / 32, bars: 8 }} selected={selected} onLaunch={fn()} onStop={fn()} onStopTrack={fn()} onSelectTrack={setSelected} onToggleSong={fn()} />;
        case 'mix':
          return (
            <TrackStrips
              tracks={only(strips, 'tracks')}
              returns={stripReturns}
              selected={selected}
              onLevel={({ track: t, level }) => setStrips((all) => all.map((s) => (s.id === t ? { ...s, level } : s)))}
              onSend={({ track: t, send, level }) => setStrips((all) => all.map((s) => (s.id === t ? { ...s, sends: (send === 0 ? [level, s.sends?.[1] ?? 0] : [s.sends?.[0] ?? 0, level]) as [number, number] } : s)))}
              onReturn={fn()}
              onMute={(t) => setStrips((all) => all.map((s) => (s.id === t ? { ...s, muted: !s.muted } : s)))}
              onSolo={(t) => setStrips((all) => all.map((s) => (s.id === t ? { ...s, soloed: !s.soloed } : s)))}
              onArm={(t) => setStrips((all) => all.map((s) => (s.id === t ? { ...s, armed: !s.armed } : s)))}
              onSelect={setSelected}
            />
          );
        case 'song':
          return (
            <SongCard
              song={jam ? undefined : { id: 'hidden', name: 'Hidden Signals', tempo: TEMPO, key: 'Am' }}
              index={jam ? undefined : 3}
              total={7}
              next={{ id: 'wire', name: 'Wire', tempo: 118, key: 'G', cued: true, barsToCue: barsLeft }}
              jam={jam}
              onJam={() => setJam((j) => !j)}
            />
          );
        case 'dice':
          return <DicePad target={track.name} moves={picks('moves') as readonly DiceMove[] | undefined} scaleLock={scaleLock} onScaleLock={setScaleLock} chaos={chaos} onChaos={setChaos} onDice={fn()} />;
        case 'sections':
          return <SectionBar sections={songSections} current="verse" queued={queuedSection} hint="change on phrase" onSection={setQueuedSection} />;
        case 'stems':
          return (
            <StemDeck
              title="Hidden Signals"
              sub={`${TEMPO} · Am · warped`}
              stems={stems}
              markers={deckMarkers}
              position={((beat % 256) + 256) % 256 / 256}
              onMute={(id) => setStems((all) => all.map((s) => (s.id === id ? { ...s, muted: !s.muted } : s)))}
            />
          );
        case 'compass':
          return (
            <ChordCompass
              chords={compassProgression}
              index={index}
              keyName="C"
              beatsToNext={toNext}
              follow={follow}
              onFollow={setFollow}
              bassLock={bassLock}
              onBassLock={setBassLock}
              onPick={(c) => setPicked((p) => (p === c ? undefined : c))}
            />
          );
        case 'follow':
          return <ProgressionStrip chords={progressionChords} index={index} beat={beat} follow={loopFollow} onFollow={setLoopFollow} onSelect={fn()} onMutate={fn()} onKeep={fn()} onRevert={() => setPicked(undefined)} />;
        case 'orbits':
          return <OrbitClock generators={orbitGenerators} tracks={orbitTracks} beat={beat} chaos={0.25} chord={chordName} selected={trackId} onSelect={setSelected} onMutate={fn()} onShake={fn()} onKeep={fn()} onRevert={() => setPicked(undefined)} />;
        case 'spine':
          return (
            <SignalSpine
              track={track}
              chain={track.id === 'keys' ? keysChain : audioChain(track.source)}
              layers={layers}
              loopBars={8}
              beat={beat}
              outs={['Main L/R', 'IEM 2']}
              meter={strips.find((s) => s.id === track.id)?.meter}
              onPrev={() => step(track.id, -1)}
              onNext={() => step(track.id, 1)}
              onStage={fn()}
              onUndo={() => setLayers((l) => (l.length > 1 ? l.slice(0, -1) : l))}
              onMuteLayer={(lid) => setLayers((l) => l.map((x) => (x.id === lid ? { ...x, muted: !x.muted } : x)))}
              onParam={fn()}
            />
          );
        case 'push':
          return (
            <PushTwin
              tracks={pushTracks}
              sections={pushSections}
              section={1}
              queuedSection={2}
              transitions={pushTransitions}
              held={held}
              scenes={pushScenes}
              scene={scene}
              selected={selected}
              onPad={(p) => {
                if (p.row === 'transitions') setHeld((h) => (h === pushTransitions[p.column] ? undefined : pushTransitions[p.column]));
                else if (p.row === 'clips' || p.row === 'stop') setSelected(pushTracks[p.column]?.id ?? selected);
              }}
              onScene={setScene}
            />
          );
        case 'landing':
          return <LandingDial via="RISER" lands="Wire" landsHint="118 · G" hit="DROP" target={target} onTarget={setTarget} length={length} onLength={setLength} barsLeft={Math.min(barsLeft, length)} beat={beat} armed onCancel={fn()} />;
        case 'cuts':
          return <CutPads pads={only(cuts, 'pads')} selected="riser" onFire={(c) => setCuts((all) => all.map((p) => (p.id === c ? { ...p, state: p.state === 'fired' ? 'idle' : 'fired' } : p)))} />;
        case 'throws':
          return <ThrowPads pads={throws} onMove={({ id: pad, x, y }) => setThrows((all) => all.map((p) => (p.id === pad ? { ...p, x, y, trail: [...(p.trail ?? []).slice(-23), { x: p.x, y: p.y }] } : p)))} />;
        case 'controls':
          return (
            <ControlPanel
              cells={(settings.cells ?? []) as unknown as readonly ControlCell[]}
              columns={(settings.columns as number) ?? 8}
              rows={(settings.rows as number) ?? 4}
              params={controlParams}
              values={values}
              onParam={({ param, value }) => setValues((v) => ({ ...v, [param]: value }))}
              onTrigger={({ param, down }) => setValues((v) => ({ ...v, [param]: down ? 1 : 0 }))}
              onTouch={({ param, down }) => setTouched((all) => (down ? [...all.filter((p) => p !== param), param] : all.filter((p) => p !== param)))}
              onCells={configure ? (next) => configure({ ...settings, cells: next as never }) : undefined}
              learning={learning}
              learnTarget={learnTarget}
              mappings={mappings}
              onLearn={setLearnTarget}
              onForget={(param) => setMappings(({ [param]: _gone, ...rest }) => rest)}
            />
          );
        case 'rig':
          return <RigHealth {...rigHealthBoard} onOpen={fn()} />;
      }
    };
  }, [values, learning, learnTarget, mappings, beat, selected, queuedSection, stems, jam, scaleLock, chaos, follow, loopFollow, bassLock, target, length, held, scene, layers, picked, strips, throws, cuts, index, toNext, chordName, barsLeft]);

  /**
   * The stand-in for the app's MIDI: a controller's CC moved to `value` (0–1). Waiting on a
   * parameter, the CC is mapped to it; otherwise a mapped CC moves its parameter across its range.
   */
  const midi = (cc: number, value: number) => {
    const name = `CC ${cc} · ch 1`;
    if (learnTarget) {
      setMappings((m) => ({ ...Object.fromEntries(Object.entries(m).filter(([, v]) => v !== name)), [learnTarget]: name }));
      setLearnTarget(undefined);
      return;
    }
    const param = Object.entries(mappings).find(([, v]) => v === name)?.[0];
    const p = controlParams.find((x) => x.id === param);
    if (p) setValues((v) => ({ ...v, [p.id]: p.param.min + value * (p.param.max - p.param.min) }));
  };

  return { beat, selected, setSelected, content, touched, learning, setLearning: (on: boolean) => { setLearning(on); if (!on) setLearnTarget(undefined); }, midi };
}
