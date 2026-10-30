// RigHealth's stories as plain props: RigHealth.stories.tsx draws them with React's or Svelte's
// `Tree`. A Friday rig: Nord and Vox fine, Gtr barely there, Bass silent; the footswitch unplugged.
import { defineFixtures } from '../../../fixtures';
import type { RigDevice, RigHealthProps, RigInput } from './RigHealth.model';

export const rigInputs: readonly RigInput[] = [
  { id: 'nord', name: 'Nord', state: 'ok', level: 0.62 },
  { id: 'vox', name: 'Vox', state: 'ok', level: 0.74 },
  { id: 'gtr', name: 'Gtr', state: 'low', level: 0.08 },
  { id: 'bass', name: 'Bass', state: 'none', level: 0 },
];

export const rigDevices: readonly RigDevice[] = [
  { id: 'push', name: 'Push', connected: true },
  { id: 'mcu', name: 'MCU', connected: true },
  { id: 'chord', name: 'Chord kbd', connected: true },
  { id: 'foot', name: 'Footswitch', connected: false },
];

/** The last 24 seconds of DSP load, oldest first, with one spike. */
export const rigLoad: readonly number[] = [
  0.1, 0.11, 0.1, 0.12, 0.14, 0.12, 0.11, 0.13, 0.18, 0.22, 0.16, 0.12, 0.11, 0.12, 0.1, 0.12, 0.13, 0.12, 0.15, 0.13, 0.12, 0.11,
  0.12, 0.12,
];

const allGood: readonly RigInput[] = rigInputs.map((i) => ({ ...i, state: 'ok', level: Math.max(i.level, 0.5) }));

/** The rig as the views use it. */
export const rigHealthBoard: RigHealthProps = { inputs: rigInputs, devices: rigDevices, load: rigLoad, xruns: 0, frames: 64, quantize: '1 bar', countIn: '1 bar' };

/** The controls, the same in both Storybooks. */
export const rigHealthArgTypes = {
  inputs: { control: 'object' },
  devices: { control: 'object' },
  load: { control: 'object' },
  xruns: { control: { type: 'number', min: 0 } },
  frames: { control: { type: 'number', min: 16 } },
  quantize: { control: 'text' },
  countIn: { control: 'text' },
  form: { control: 'inline-radio', options: ['strip', 'dots'] },
  onOpen: { control: false },
} as const;

/** Every story's args by export name. */
export const rigHealthStories = defineFixtures<RigHealthProps>()({
  Default: { args: rigHealthBoard },
  EveryState: { args: { ...rigHealthBoard, xruns: 3, load: [...rigLoad.slice(0, -3), 0.48, 0.71, 0.66] } },
  AllGood: { args: { ...rigHealthBoard, inputs: allGood, devices: rigDevices.map((d) => ({ ...d, connected: true })) } },
  Dense: { args: { ...rigHealthBoard, form: 'dots' } },
  Empty: { args: { inputs: [], devices: [], load: [] } },
  Disabled: { args: rigHealthBoard },
});
