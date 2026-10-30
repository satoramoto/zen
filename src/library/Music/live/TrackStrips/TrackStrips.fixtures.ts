// TrackStrips' stories as plain props: TrackStrips.stories.tsx draws them with React's or Svelte's
// `Tree`. Eight tracks, keys armed, vox soloed, gtr muted; the FX A / FX B returns at the right.
import { defineFixtures } from '../../../fixtures';
import type { TrackReturn, TrackStrip, TrackStripsProps } from './TrackStrips.model';

/** Eight strips with levels, meters, sends and lamps. */
export const stripTracks: readonly TrackStrip[] = [
  { id: 'drums', name: 'Drums', ink: 'drums', level: 0.8, meter: 0.7, sends: [0.4, 0.75] },
  { id: 'bass', name: 'Bass', ink: 'bass', level: 0.75, meter: 0.6, sends: [0.3, 0.2] },
  { id: 'keys', name: 'Keys', ink: 'piano', level: 0.7, meter: 0.5, sends: [0.6, 0.4], armed: true },
  { id: 'vox', name: 'Vox', ink: 'vocals', level: 0.8, meter: 0.65, sends: [0.5, 0.5], soloed: true },
  { id: 'gtr', name: 'Gtr', ink: 'guitar', level: 0.6, meter: 0.4, sends: [0.2, 0.1], muted: true },
  { id: 'perc', name: 'Perc', ink: 'drums', level: 0.55, meter: 0.45, sends: [0.35, 0.3] },
  { id: 'syn', name: 'Syn', ink: 'other', level: 0.65, meter: 0.5, sends: [0.45, 0.55] },
  { id: 'fx', name: 'FX', ink: 'other', level: 0.5, meter: 0.3 },
];

/** The two effect returns after the tracks. */
export const stripReturns: readonly TrackReturn[] = [
  { id: 'fxa', name: 'FX A', level: 0.7 },
  { id: 'fxb', name: 'FX B', level: 0.6 },
];

/** The mixer as the views use it. */
export const trackStripsBoard: TrackStripsProps = { tracks: stripTracks, returns: stripReturns, selected: 'keys' };

/** The controls, the same in both Storybooks. */
export const trackStripsArgTypes = {
  tracks: { control: 'object' },
  returns: { control: 'object' },
  selected: { control: 'text' },
  form: { control: 'inline-radio', options: ['tall', 'short'] },
  onLevel: { control: false },
  onSend: { control: false },
  onReturn: { control: false },
  onMute: { control: false },
  onSolo: { control: false },
  onArm: { control: false },
  onSelect: { control: false },
} as const;

/** Every story's args by export name. */
export const trackStripsStories = defineFixtures<TrackStripsProps>()({
  Default: { args: trackStripsBoard },
  EveryState: {
    args: {
      tracks: [
        { ...stripTracks[0], muted: true },
        { ...stripTracks[1], soloed: true },
        { ...stripTracks[2], armed: true },
        { ...stripTracks[3], muted: true, soloed: true, armed: true },
        { ...stripTracks[4], level: 0, meter: 0, sends: [0, 0] },
        { ...stripTracks[5], level: 1, meter: 1, sends: [1, 1] },
      ],
      returns: stripReturns,
      selected: 'bass',
    },
  },
  Dense: { args: { tracks: stripTracks.slice(0, 4), returns: stripReturns.slice(0, 1), selected: 'vox', form: 'short' } },
  Empty: { args: { tracks: [], returns: [] } },
  Disabled: { args: trackStripsBoard },
});
