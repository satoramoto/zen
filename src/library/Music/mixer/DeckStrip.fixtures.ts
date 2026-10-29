import type { MixerDeck, MixerFrame, MixerParams, MixerTheme } from './model';

export const deckParams: MixerParams = {
  level: { kind: 'float', min: 0, max: 100, defaultValue: 80, unit: 'percent' },
  trim: { kind: 'float', min: -24, max: 12, defaultValue: 0, unit: 'decibel' },
  send: { kind: 'float', min: 0, max: 100, defaultValue: 0, unit: 'percent' },
  eq: { kind: 'float', min: -24, max: 12, defaultValue: 0, unit: 'decibel' },
  filter: { kind: 'float', min: -100, max: 100, defaultValue: 0, unit: 'int' },
  filterResonance: { kind: 'float', min: 0, max: 12, defaultValue: 0, unit: 'decibel' },
  tempo: { kind: 'float', min: 80, max: 160, defaultValue: 124, unit: 'float' },
  cross: { kind: 'float', min: -100, max: 100, defaultValue: 0, unit: 'int' },
};

export const deckTheme: MixerTheme = {
  primary: 'var(--primary)', signal: 'var(--signal)',
  stems: Object.fromEntries(['drums', 'bass', 'other', 'vocals', 'guitar', 'piano'].map(id => [id, `var(--stem-${id})`])),
  decks: { 'deck-a': { ink: 'var(--deck-a)', waveform: 'var(--deck-a-waveform)' } },
};

export const readyDeck: MixerDeck = {
  id: 'deck-a', letter: 'A', status: 'ready',
  track: { id: 'after-the-rain', title: 'After the rain', artist: 'North Arcade', bpm: 124, key: '8A' },
  peaks: [], sections: ['Intro', 'Verse', 'Build', 'Drop', 'Break', 'Outro'].map(name => ({ id: name.toLowerCase(), name })),
  stems: ['Drums', 'Bass', 'Other', 'Vocals'].map((name, index) => ({
    id: name.toLowerCase(), name, level: [85, 78, 66, 82][index], available: true,
    selected: 'drop', queued: undefined, playing: true,
  })),
  full: false, fullSection: 'drop', fullQueued: undefined,
  gain: 80, trim: -1.5, sendA: 18, sendB: 6, filter: 0, filterResonance: 2, eq: [0, -2, 1], route: 0, cue: false,
  playing: false, synced: true, cueHeld: false, gridAvailable: true,
  loop: { start: 32, end: 40, enabled: true }, canLoopOut: true, slip: false, loopFocus: false,
};

export const deckReading: MixerFrame = {
  decks: { 'deck-a': { beat: 35.5, level: .68, stereo: [.68, .57], seconds: 17.2, duration: 210 } },
  masterLevel: .7, masterStereo: [.71, .64],
};

/** Deliberately distinguish no pending change, queued launch, and pending stop. */
export const queuedDeck: MixerDeck = {
  ...readyDeck, message: 'Changes wait for the next bar',
  stems: readyDeck.stems.map((stem, index) => ({ ...stem, queued: index === 0 ? 'build' : index === 3 ? null : undefined })),
};
export const stoppedQueueDeck: MixerDeck = { ...readyDeck, stems: readyDeck.stems.map(stem => ({ ...stem, queued: null })) };
export const fullDeck: MixerDeck = { ...readyDeck, full: true, fullQueued: 'break', syncLeader: true };
export const sixStemDeck: MixerDeck = {
  ...queuedDeck,
  stems: [...queuedDeck.stems,
    { id: 'guitar', name: 'Guitar', level: 62, available: true, selected: 'verse', queued: undefined },
    { id: 'piano', name: 'Piano', level: 54, available: false, selected: null, queued: undefined },
  ],
};
export const pendingLoopDeck: MixerDeck = { ...readyDeck, loop: { start: 32, end: null, enabled: false }, canLoopOut: true };
export const emptyDeck: MixerDeck = {
  ...readyDeck, track: null, status: 'empty', message: 'Drop a track here', playing: false, synced: false,
  loop: undefined, canLoopOut: false, gridAvailable: false, fullSection: null,
  stems: readyDeck.stems.map(stem => ({ ...stem, available: false, selected: null })),
};
export const unavailableDeck: MixerDeck = { ...emptyDeck, status: 'unavailable', message: 'Stems are unavailable. Load another track.' };

export const deckFixtures = {
  Default: readyDeck,
  QueuedLaunchAndStop: queuedDeck,
  AllStopsQueued: stoppedQueueDeck,
  FullMix: fullDeck,
  FullStopQueued: { ...fullDeck, fullQueued: null },
  SixStems: sixStemDeck,
  LoopInPending: pendingLoopDeck,
  Empty: emptyDeck,
  Loading: { ...emptyDeck, status: 'loading', message: 'Separating stems…' },
  Unavailable: unavailableDeck,
} satisfies Record<string, MixerDeck>;
