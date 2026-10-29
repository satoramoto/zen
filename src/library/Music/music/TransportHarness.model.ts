/** Story-only controlled host. Both renderer harnesses share these commands and this view. */
import { transportHandlers, transportView, type TransportModelProps, type TransportUnit } from './Transport.model';
import type { Param } from '../param/param';

export const TRANSPORT_TEMPO: Param = { kind: 'float', min: 60, max: 200, defaultValue: 120, unit: 'custom', customUnit: '%0.1f' };

export interface TransportStoryArgs {
  playing: boolean;
  onPlay(playing: boolean): void;
  onStop(): void;
  onLoopChange?(on: boolean): void;
  onTempoChange?(bpm: number): void;
  disabled?: boolean;
  withStop: boolean;
  withLoop: boolean;
  looping: boolean;
  loopingPart: boolean;
  tempo: 'none' | 'reading' | 'field';
  bpm: number;
  tempoDisabled?: boolean;
  withNormalSpeed: boolean;
  seconds: number;
  withBeats: boolean;
  bar: number;
  bars: number;
  fine?: boolean;
  latency?: number;
  playTitle?: string;
  stopTitle?: string;
  remember?: string;
  className?: string;
}

export interface TransportHostState {
  given: string;
  playing: boolean;
  looping: boolean;
  bpm: number;
  seconds: number;
  bar: number;
  unit: TransportUnit;
}

export function initialTransportHost(args: TransportStoryArgs): TransportHostState {
  const { playing, looping, bpm, seconds, bar } = args;
  return { given: JSON.stringify([playing, looping, bpm, seconds, bar]), playing, looping, bpm, seconds, bar, unit: 'beats' };
}

function current(args: TransportStoryArgs, held: TransportHostState): TransportHostState {
  const initial = initialTransportHost(args);
  return initial.given === held.given ? held : { ...initial, unit: held.unit };
}

function transportProps(args: TransportStoryArgs, held: TransportHostState, update: (next: Partial<TransportHostState>) => void = () => {}): TransportModelProps {
  return {
    playing: held.playing,
    onPlay: (playing) => { args.onPlay(playing); update({ playing }); },
    onStop: args.withStop ? () => { args.onStop(); update({ playing: false, seconds: 0, bar: 0 }); } : undefined,
    disabled: args.disabled,
    playTitle: args.playTitle || undefined,
    stopTitle: args.stopTitle || undefined,
    loop: args.withLoop ? { on: held.looping, onChange: (looping) => { args.onLoopChange?.(looping); update({ looping }); }, partial: args.loopingPart, title: 'Loop the whole track' } : undefined,
    tempo: args.tempo === 'none' ? undefined : {
      param: TRANSPORT_TEMPO, value: held.bpm, display: held.bpm.toFixed(held.bpm % 1 ? 1 : 0), label: 'Tempo', disabled: args.tempoDisabled,
      onChange: args.tempo === 'field' ? (bpm) => { args.onTempoChange?.(bpm); update({ bpm }); } : undefined,
    },
    normalSpeed: args.withNormalSpeed ? { onPress: () => { args.onTempoChange?.(124); update({ bpm: 124 }); }, disabled: held.bpm === 124, title: 'Back to the record’s own tempo' } : undefined,
    position: { seconds: held.seconds, bar: args.withBeats ? held.bar : undefined, bars: args.bars },
    fine: args.fine,
    latency: args.latency || undefined,
    remember: args.remember,
    className: args.className,
  };
}

export function transportHostView(args: TransportStoryArgs, held: TransportHostState) {
  const value = current(args, held);
  return transportView(transportProps(args, value), value.unit);
}

export function transportHostHandlers(args: TransportStoryArgs, held: TransportHostState, get: () => TransportHostState, set: (next: TransportHostState) => void) {
  const update = (next: Partial<TransportHostState>) => set({ ...current(args, get()), ...next });
  // Read the subscribed value explicitly: a hidden get() call is not a Svelte dependency.
  // The commands must change with the drawing, especially Play becoming Pause.
  return transportHandlers(transportProps(args, current(args, held), update), (unit) => update({ unit }));
}
