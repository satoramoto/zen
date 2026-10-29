import { defineFixtures } from '../../fixtures';
import type { Param } from '../param/param';
import type { MixerParams, MixerState, MixerTheme } from './model';
import type { MasterStripProps } from './MasterStrip.model';

const LEVEL: Param = { kind: 'float', min: 0, max: 100, defaultValue: 80, unit: 'percent' };
const SEND: Param = { ...LEVEL, defaultValue: 0 };
const TRIM: Param = { kind: 'float', min: -24, max: 12, defaultValue: 0, unit: 'decibel' };
const FILTER: Param = { kind: 'float', min: -100, max: 100, defaultValue: 0, unit: 'int' };

export const masterStripParams: MixerParams = {
  level: LEVEL, trim: TRIM, send: SEND, eq: TRIM, filter: FILTER,
  tempo: { kind: 'float', min: 80, max: 160, defaultValue: 124, unit: 'float' },
  cross: FILTER,
};

export const masterStripTheme: MixerTheme = {
  primary: 'var(--accent)', signal: 'var(--success)', stems: {}, decks: {},
};

/** Deterministic host data, not an audio engine or a second master implementation. */
export function masterStripState(patch: Partial<MixerState> = {}): MixerState {
  return {
    decks: [], running: false, beat: 65, bpm: 124, cross: 0,
    loop: { start: null, end: null, enabled: false }, canLoopOut: false,
    launchBeats: 4, quantize: 0, loopBeats: 8,
    master: 80, masterTrim: 0, masterFilter: 0, masterSendA: 0, masterSendB: 0, masterEq: [0, 0, 0],
    effects: [
      { id: 'delay', name: 'Delay', controls: [
        { id: 'feedback', name: 'Feedback', param: { ...SEND, defaultValue: 35 } },
        { id: 'time', name: 'Time', param: { kind: 'float', min: 1, max: 1000, defaultValue: 375, unit: 'time' } },
      ] },
      { id: 'reverb', name: 'Reverb', controls: [
        { id: 'decay', name: 'Decay', param: { kind: 'float', min: 0.1, max: 10, defaultValue: 2.5, unit: 'float' } },
        { id: 'damping', name: 'Damping', param: { ...SEND, defaultValue: 45 } },
      ] },
      { id: 'chorus', name: 'Chorus' },
    ],
    fxA: 'delay', fxB: 'reverb', effectsEnabled: true, effectEnabled: { A: true, B: false },
    effectHighPassParam: SEND, effectHighPass: { A: 0, B: 15 },
    effectHighPassHint: 'Cuts low frequencies before the send effect.',
    phonesLevel: 75, phonesMix: 25,
    ...patch,
  };
}

const args = { state: masterStripState(), params: masterStripParams, theme: masterStripTheme, externalTransport: false };

export const masterStripStories = defineFixtures<MasterStripProps>()({
  Default: { args },
  Transport: { args: { ...args, state: masterStripState({ running: true }) } },
  FXSelection: { args },
  HostCallbacks: { args },
  EffectsAndPhones: { args },
  // JavaScript hosts can send null readings despite the original numeric TypeScript API.
  // Keep that API; explicitly exercise the source's existing ?? fallback semantics at the boundary.
  NullValues: { args: { ...args, state: masterStripState({
    effectValues: { A: { delay: { feedback: null as unknown as number } } },
    effectHighPass: { A: null as unknown as number, B: 0 },
    phonesLevel: null as unknown as number, phonesMix: null as unknown as number,
    effectEnabled: undefined, effectsEnabled: undefined,
  }) } },
  ExternalTransport: { args: { ...args, externalTransport: true } },
  PlaybackUnavailable: { args: { ...args, state: masterStripState({ playbackAvailable: false }) } },
  ReadOnlyEffects: { args },
  TailsDecaying: { args: { ...args, state: masterStripState({ effectsEnabled: false, effectTailing: true }) } },
  NoEffects: { args: { ...args, state: masterStripState({ effects: [], fxA: '', fxB: '', effectHighPassParam: undefined }) } },
});
