import type { MixerDeck, MixerFrame, MixerTheme } from './model';
import { defineFixtures } from '../../fixtures';
import type { FrameWaveformProps } from './frames.model';

const peaks = Array.from({ length: 128 }, (_, i) => ({ min: -0.15 - (i % 7) / 12, max: 0.2 + (i % 11) / 15 }));
export const frameDeck: MixerDeck = {
  id: 'a', letter: 'A', status: 'ready', focus: 'drums', full: false, independentStems: true,
  track: { id: 'test', title: 'Independent sources', artist: 'Fixture', bpm: 120, key: 'Am' },
  peaks, sections: [], fullSection: null, fullQueued: undefined,
  gain: 100, trim: 0, sendA: 0, sendB: 0, filter: 0, eq: [0, 0, 0], route: 1, cue: false, zoom: 32,
  stems: [
    { id: 'drums', name: 'Drums', available: true, playing: true, level: 100, selected: null, queued: undefined },
    { id: 'bass', name: 'Bass', available: true, playing: false, level: 100, selected: null, queued: undefined },
  ],
  waveform: { start: 0, length: 128, visible: 32, lanes: [
    { id: 'drums', name: 'Drums', peaks, cue: 4, stemCue: 8, loop: { start: 16, end: 24, enabled: true } },
    { id: 'bass', name: 'Bass', peaks, cue: 4, stemCue: 12, loop: { start: 24, end: null, enabled: false } },
  ] },
};
export const frameTheme: MixerTheme = {
  primary: 'var(--primary)', signal: 'var(--play-signal)', decks: {},
  stems: { drums: 'var(--stem-drums)', bass: 'var(--stem-bass)' },
};
export const frameReading: MixerFrame = {
  masterLevel: 0.65,
  decks: { a: { beat: 16, level: 0.7, seconds: 8, duration: 64, sources: {
    drums: { beat: 16, seconds: 8, playing: true, enabled: true, backgroundBeat: 20 },
    bass: { beat: 24, seconds: 12, playing: false, enabled: true },
  } } },
};

export const frameStories = defineFixtures<FrameWaveformProps>()({
  IndependentSources: { args: {} },
  WholeTrack: { args: { deck: {
    ...frameDeck, full: true, waveform: { ...frameDeck.waveform!, fixed: true, visible: 128, lanes: [frameDeck.waveform!.lanes[0]!] },
  } } },
});
