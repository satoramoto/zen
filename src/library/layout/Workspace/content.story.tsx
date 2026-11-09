// The Workspace stories' stand-in app content: each kind of the fixtures' panes drawn as its real
// widget from `components/music`, wired to spies the plays don't assert, under a caption naming the
// instance and the target the Workspace resolved for it. Story harness only.
import type { ReactNode } from 'react';
import { fn } from 'storybook/test';
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
import { Text } from '../../primitives/Text';
import type { SurfaceRegion } from './Workspace.types';
/** The set's eight tracks: the grid's cells with the mixer's levels, meters, sends and lamps. */
const tracks: readonly LiveTrack[] = loopBoard.map((track, i) => {
  const strip = mixBoard[i % mixBoard.length];
  return { ...track, level: strip.level, meter: strip.meter, sends: strip.sends ?? [0, 0], muted: strip.muted, soloed: strip.soloed, armed: strip.armed, parked: strip.parked };
});

/** A widget under a caption naming its instance and target: what the plays read. */
function face(region: SurfaceRegion, target: string | undefined, children: ReactNode): ReactNode {
  return (
    <div data-testid={`pane-${region.id}`} data-kind={region.kind} data-target={target ?? ''} style={{ position: 'relative', height: '100%', minHeight: 0 }}>
      <Text
        role="caption"
        tone="muted"
        style={{ position: 'absolute', top: 2, left: 2, zIndex: 1, pointerEvents: 'none', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', padding: '0 var(--space-1)' }}
      >
        {target ? `${region.title} → ${target}` : region.title}
      </Text>
      {children}
    </div>
  );
}

const widgets: Record<string, () => ReactNode> = {
  loopGrid: () => <LoopGrid songs={loopSongs} tracks={tracks} loop={{ phase: 0.5, bars: 8 }} selected="keys" onLaunch={fn()} onStop={fn()} onStopTrack={fn()} onSelectTrack={fn()} onToggleSong={fn()} />,
  mix: () => <MixBand tracks={tracks} sends={[...mixReturns]} selected="keys" onLevel={fn()} onSend={fn()} onReturn={fn()} onArm={fn()} onMute={fn()} onSolo={fn()} onSelect={fn()} />,
  follow: () => <ChordStrip chords={[...(chordStripBoard.chords ?? [])]} index={chordStripBoard.index ?? 2} onFollow={fn()} onMutate={fn()} onKeep={fn()} onRevert={fn()} />,
  arp: () => <ArpSequencer state={arpSequencerBoard.state!} chords={[...(arpSequencerBoard.chords ?? [])]} index={arpSequencerBoard.index ?? 0} onStep={fn()} onState={fn()} />,
  throws: () => <MacroPads pads={[...MACRO_PADS]} onMove={fn()} />,
  cuts: () => <TransitionRow pads={[...transitionBoard]} selected="drop" onFire={fn()} />,
  stems: () => <StemLanes {...stemLanesBoard} onCue={fn()} onToggle={fn()} />,
};

/** The app's `pane`: the kind's widget, or a plain card for a kind of the story's own. */
export function workspacePane(region: SurfaceRegion, target: string | undefined): ReactNode {
  const draw = widgets[region.kind];
  return face(region, target, draw ? draw() : <Text role="body">{region.kind}</Text>);
}
