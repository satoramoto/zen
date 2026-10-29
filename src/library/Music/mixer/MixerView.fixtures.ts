// Shared, framework-free static specimens. Clocks are data, never Date.now()/performance.now().
import { defineFixtures } from '../../fixtures';
import type { MixerDeck, MixerFrame, MixerState, MixerViewProps } from './model';
import {
  createPreviewState, previewDeck, previewDeckIds, previewParams, previewPeaks,
} from '../stories/previewMixer';

const reference = createPreviewState();
const running: MixerState = {
  ...createPreviewState(), running: true, beat: 49,
  loop: { start: 48, end: 64, enabled: true },
  decks: createPreviewState().decks.map(deck => ({ ...deck, playing: true })),
};
const queued: MixerState = {
  ...running, beat: 51,
  decks: running.decks.map((deck, i) => ({
    ...deck,
    ...(i === 3 ? { full: true, fullQueued: 'break' } : {}),
    stems: deck.stems.map((stem, s) => ({ ...stem, queued: i === 0 && s < 2 ? 'break' : i === 2 ? null : undefined })),
  })),
};
const fourToSix: MixerState = {
  ...createPreviewState(), decks: [4, 5, 6, 4].map((count, i) => previewDeck(i, count)),
};
const statuses: MixerState = {
  ...createPreviewState(),
  decks: [
    { ...previewDeck(0, 6), stems: previewDeck(0, 6).stems.map(stem => ({ ...stem, available: stem.id !== 'piano' })), message: 'Piano stem is unavailable; the remaining five are ready.' },
    { ...previewDeck(1), status: 'empty', track: null, peaks: [], stems: [], sections: [], fullSection: null, message: 'Drop a track here' },
    { ...previewDeck(2), status: 'loading', peaks: [], message: 'Reading track and preparing waveforms…' },
    { ...previewDeck(3), status: 'unavailable', peaks: [], message: 'Source file not found. Relink this track to continue.', stems: previewDeck(3).stems.map(stem => ({ ...stem, available: false })) },
  ] satisfies MixerDeck[],
};
const sourceLanes: MixerState = {
  ...fourToSix, running: true, beat: 49,
  decks: fourToSix.decks.map((deck, i) => ({
    ...deck, playing: true, full: i === 3, focus: deck.stems[i % deck.stems.length].id,
    independentStems: true, moveTogether: false, gridAvailable: true, zoom: 32,
    loop: { start: 48, end: 56, enabled: true },
    waveform: {
      start: 0, length: 128, visible: i === 3 ? 128 : 32, fixed: i === 3,
      lanes: i === 3
        ? [{ id: 'full', name: 'Original', peaks: deck.peaks, cue: 32, loop: { start: 48, end: 56, enabled: true } }]
        : deck.stems.map((stem, s) => ({
            id: stem.id, name: stem.name, peaks: previewPeaks[i][s], cue: 32,
            ...(s === 1 ? { stemCue: 48, loop: { start: 48, end: 56, enabled: true } } : {}),
          })),
    },
  })),
};

const fixedFrame = (state: MixerState, beat: number): MixerFrame => ({
  decks: Object.fromEntries(state.decks.map((deck, i) => {
    const level = state.running && deck.gain > 0 ? [0.48, 0.39, 0.26, 0.31][i] : 0;
    return [deck.id, {
      beat, level, stereo: [level, level * 0.94], seconds: beat * 60 / state.bpm, duration: 128 * 60 / state.bpm,
      sources: Object.fromEntries((deck.full ? ['full'] : deck.stems.map(stem => stem.id)).map((id, s) => {
        const at = state === sourceLanes ? beat - s * 0.75 : beat;
        return [id, { beat: at, seconds: at * 60 / state.bpm, playing: state.running, enabled: true }];
      })),
    }];
  })),
  masterLevel: state.running ? 0.67 : 0,
  masterStereo: state.running ? [0.67, 0.63] : [0, 0],
});

export const mixerStories = defineFixtures<MixerViewProps>()({
  Reference: { args: { state: reference, params: previewParams, externalTransport: false } },
  RunningReference: { args: { state: running, params: previewParams, externalTransport: false } },
  Queued: { args: { state: queued, params: previewParams, externalTransport: false } },
  FourToSixStems: { args: { state: fourToSix, params: previewParams, externalTransport: false } },
  EmptyLoadingUnavailable: { args: { state: statuses, params: previewParams, externalTransport: false } },
  SourceLanes: { args: { state: sourceLanes, params: previewParams, externalTransport: false } },
  ExternalTransport: { args: { state: createPreviewState(), params: previewParams, externalTransport: true } },
});

/** Sample these as often as desired; the screenshot clock cannot advance. */
export const mixerFrames: Record<keyof typeof mixerStories, MixerFrame> = {
  Reference: fixedFrame(reference, 0),
  RunningReference: fixedFrame(running, 49.5),
  Queued: fixedFrame(queued, 51.25),
  FourToSixStems: fixedFrame(fourToSix, 0),
  EmptyLoadingUnavailable: fixedFrame(statuses, 0),
  SourceLanes: fixedFrame(sourceLanes, 49.5),
  ExternalTransport: fixedFrame(reference, 0),
};

// The IDs are exported for browser comparison harnesses that supply the same host data to widgets.
export { previewDeckIds };
