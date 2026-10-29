// MixBand's stories as plain props: MixBand.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer).
import { defineFixtures } from '../../../fixtures';
import type { LiveSend, LiveTrack } from '../live.model';
import type { MixBandModelProps } from './MixBand.model';

/** Eight strips with levels, meters, sends and lamps, the way the mockups lay them out. */
export const mixBoard: readonly LiveTrack[] = [
  { id: 'drums', name: 'Drums', hue: 1, level: 0.8, meter: 0.7, sends: [0.4, 0.75], cells: [] },
  { id: 'bass', name: 'Bass', hue: 2, level: 0.75, meter: 0.6, sends: [0.3, 0.2], cells: [] },
  { id: 'keys', name: 'Keys', hue: 3, level: 0.7, meter: 0.5, sends: [0.6, 0.4], armed: true, cells: [] },
  { id: 'vox', name: 'Vox', hue: 4, level: 0.8, meter: 0.65, sends: [0.5, 0.5], soloed: true, cells: [] },
  { id: 'gtr', name: 'Gtr', hue: 5, level: 0.6, meter: 0.4, sends: [0.2, 0.1], muted: true, cells: [] },
  { id: 'perc', name: 'Perc', hue: 1, level: 0.55, meter: 0.45, sends: [0.35, 0.3], cells: [] },
  { id: 'syn', name: 'Syn', hue: 2, level: 0.65, meter: 0.5, sends: [0.45, 0.55], cells: [] },
  { id: 'fx', name: 'FX', hue: 3, level: 0.5, meter: 0.3, parked: true, cells: [] },
];

/** The two effect returns after the tracks. */
export const mixReturns: readonly LiveSend[] = [
  { id: 'fxa', name: 'FX A', hue: 1, level: 0.7 },
  { id: 'fxb', name: 'FX B', hue: 2, level: 0.6 },
];

/** The controls, the same in both Storybooks. */
export const mixBandArgTypes = {
  tracks: { control: 'object' },
  sends: { control: 'object' },
  selected: { control: 'text' },
  onLevel: { control: false },
  onSend: { control: false },
  onReturn: { control: false },
  onArm: { control: false },
  onMute: { control: false },
  onSolo: { control: false },
  onSelect: { control: false },
  disabled: { control: 'boolean' },
} as const;

/** Every story's args by export name. */
export const mixBandStories = defineFixtures<MixBandModelProps>()({
  Default: { args: { tracks: mixBoard, sends: mixReturns, selected: 'keys' } },
  EveryState: {
    args: {
      tracks: [
        { ...mixBoard[0], muted: true },
        { ...mixBoard[1], soloed: true },
        { ...mixBoard[2], armed: true, parked: true },
        { ...mixBoard[3] },
      ],
      sends: mixReturns,
      selected: 'bass',
    },
  },
  Dense: { args: { tracks: mixBoard.slice(0, 4), sends: mixReturns.slice(0, 1), selected: 'vox' } },
  Empty: { args: { tracks: [], sends: [] } },
  Disabled: { args: { tracks: mixBoard, sends: mixReturns, disabled: true } },
});
