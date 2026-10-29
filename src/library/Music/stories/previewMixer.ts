// Story-only, deterministic data from widgets' Four-deck mixer preview. No audio or host dependency.
import type { MixerDeck, MixerParams, MixerState } from '../mixer/model';
import type { Param } from '../param/param';

export const previewDeckIds = ['deck-a', 'deck-b', 'deck-c', 'deck-d'];
export const previewStemIds = ['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'];
export const previewStemNames = ['Drums', 'Bass', 'Other', 'Vocals', 'Guitar', 'Piano'];
export const previewSectionIds = ['intro', 'verse', 'build', 'drop', 'break', 'outro'];
export const previewSections = ['Intro', 'Verse', 'Build', 'Drop', 'Break', 'Outro'].map((name, i) => ({ id: previewSectionIds[i], name }));
export const previewSongs = [
  { title: 'After the rain', artist: 'North Arcade', bpm: 124, key: '8A' },
  { title: 'Soft machinery', artist: 'Parallel State', bpm: 126, key: '8A' },
  { title: 'Night swimming', artist: 'Low Season', bpm: 122, key: '9A' },
  { title: 'Only the echo', artist: 'Mira Sol', bpm: 124, key: '8B' },
];
export const previewEffects = ['Delay', 'Reverb', 'Echo', 'Chorus', 'Flanger'].map(name => ({ id: name.toLowerCase(), name }));

const level: Param = { kind: 'float', min: 0, max: 100, defaultValue: 80, unit: 'percent' };
const trim: Param = { kind: 'float', min: -24, max: 12, defaultValue: 0, unit: 'decibel' };
const filter: Param = { kind: 'float', min: -100, max: 100, defaultValue: 0, unit: 'int' };
export const previewParams: MixerParams = {
  level, trim, send: { ...level, defaultValue: 0 }, eq: { ...trim }, filter,
  filterResonance: { kind: 'float', min: 0, max: 12, defaultValue: 0, unit: 'decibel' },
  tempo: { kind: 'float', min: 80, max: 160, defaultValue: 124, unit: 'float' },
  cross: { ...filter },
};

// Deliberately silhouettes, not audio data. The first four stems match the source preview exactly.
export const previewPeaks = previewSongs.map((_, deck) => previewStemIds.map((__, stem) => Array.from({ length: 384 }, (_, i) => {
  const envelope = (0.3 + 0.7 * Math.abs(Math.sin(i * 0.031 + deck))) *
    (0.2 + 0.8 * Math.abs(Math.sin(i * (0.61 + stem * 0.19) + deck * 2)));
  return { min: -envelope * 0.8, max: envelope };
})));

export function previewDeck(index: number, stemCount = 4): MixerDeck {
  return {
    id: previewDeckIds[index], letter: 'ABCD'[index],
    track: { ...previewSongs[index], id: `track-${index}` }, status: 'ready',
    playing: false, loop: { start: null, end: null, enabled: false }, canLoopOut: false,
    peaks: previewPeaks[index][0], sections: previewSections,
    stems: previewStemIds.slice(0, stemCount).map((id, i) => ({
      id, name: previewStemNames[i], available: true, level: [85, 78, 66, 82, 72, 68][i], selected: 'drop', queued: undefined,
    })),
    full: false, fullSection: 'drop', fullQueued: undefined,
    gain: index < 2 ? 80 : 0, trim: 0, sendA: 0, sendB: 0, eq: [0, 0, 0],
    filter: 0, filterResonance: 0, route: index % 2 ? 2 : 0, cue: false,
  };
}

/** Fresh state for each fixture/hook, retaining the original preview's opening composition. */
export function createPreviewState(): MixerState {
  return {
    decks: previewDeckIds.map((_, i) => previewDeck(i)),
    running: false, beat: 0, loop: { start: null, end: null, enabled: false }, canLoopOut: false,
    bpm: 124, launchBeats: 4, quantize: 0, loopBeats: 8,
    cross: 0, master: 80, masterTrim: 0, masterFilter: 0, masterSendA: 0, masterSendB: 0, masterEq: [0, 0, 0],
    effects: previewEffects, fxA: 'delay', fxB: 'reverb',
  };
}
