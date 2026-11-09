// ControlPanel's stories as plain props: ControlPanel.stories.tsx draws them with React's or Svelte's
// `Tree`. The looper board's macros: four faders on the FX the set rides, four pads it fires, a
// toggle and an XY throw, over the app's parameters and their values.
import { defineFixtures } from '../../../fixtures';
import type { ControlCell, ControlPanelProps, ControlParam } from './ControlPanel.model';

const pct = (name: string) => ({ kind: 'float', min: 0, max: 100, defaultValue: 0, unit: 'percent', name }) as const;

/** The app's parameters: what a control can move. */
export const controlParams: readonly ControlParam[] = [
  { id: 'cutoff', label: 'Filter', group: 'Master', role: 'continuous', param: { kind: 'float', min: 20, max: 20000, defaultValue: 20000, unit: 'hertz', exponent: 3, name: 'Filter' } },
  { id: 'delay', label: 'Delay send', group: 'FX', role: 'continuous', param: pct('Delay send') },
  { id: 'reverb', label: 'Reverb send', group: 'FX', role: 'continuous', param: pct('Reverb send') },
  { id: 'drive', label: 'Drive', group: 'Master', role: 'continuous', param: pct('Drive') },
  { id: 'feedback', label: 'Feedback', group: 'FX', role: 'continuous', param: pct('Feedback') },
  { id: 'time', label: 'Delay time', group: 'FX', role: 'continuous', param: pct('Delay time') },
  { id: 'freeze', label: 'Freeze', group: 'FX', role: 'switch', param: { kind: 'int', min: 0, max: 1, defaultValue: 0, name: 'Freeze' } },
  ...(['riser', 'drop', 'stutter', 'kill'] as const).map(
    (id): ControlParam => ({ id, label: id.toUpperCase(), group: 'Cuts', role: 'trigger', param: { kind: 'int', min: 0, max: 1, defaultValue: 0, name: id.toUpperCase() } }),
  ),
];

/** The parameters' values now: the app's readings. */
export const controlValues: Readonly<Record<string, number>> = { cutoff: 1200, delay: 35, reverb: 20, drive: 10, feedback: 60, time: 40, freeze: 0, riser: 0, drop: 0, stutter: 0, kill: 0 };

/** The looper's macros on an 8 × 4 grid: four faders, four pads, a freeze toggle, and the delay throw as an XY. */
export const macroCells: readonly ControlCell[] = [
  { id: 'c1', control: 'fader', param: 'cutoff', x: 0, y: 0, w: 1, h: 3 },
  { id: 'c2', control: 'fader', param: 'delay', x: 1, y: 0, w: 1, h: 3 },
  { id: 'c3', control: 'fader', param: 'reverb', x: 2, y: 0, w: 1, h: 3 },
  { id: 'c4', control: 'fader', param: 'drive', x: 3, y: 0, w: 1, h: 3 },
  { id: 'c5', control: 'pad', param: 'riser', x: 4, y: 0, w: 1, h: 1 },
  { id: 'c6', control: 'pad', param: 'drop', x: 5, y: 0, w: 1, h: 1 },
  { id: 'c7', control: 'pad', param: 'stutter', x: 4, y: 1, w: 1, h: 1 },
  { id: 'c8', control: 'pad', param: 'kill', x: 5, y: 1, w: 1, h: 1 },
  { id: 'c9', control: 'toggle', param: 'freeze', x: 4, y: 2, w: 2, h: 1 },
  { id: 'c10', control: 'xy', param: 'time', paramY: 'feedback', label: 'Delay throw', x: 6, y: 0, w: 2, h: 3 },
];

/** The controls, the same in both Storybooks. */
export const controlPanelArgTypes = {
  cells: { control: 'object' },
  columns: { control: { type: 'number', min: 1, max: 16 } },
  rows: { control: { type: 'number', min: 1, max: 8 } },
  params: { control: 'object' },
  values: { control: 'object' },
  learning: { control: 'boolean' },
  learnTarget: { control: 'text' },
  mappings: { control: 'object' },
} as const;

const base = { cells: macroCells, columns: 8, rows: 3, params: controlParams, values: controlValues };

/** Every story's args by export name. */
export const controlPanelStories = defineFixtures<ControlPanelProps>()({
  Default: { args: base },
  Unbound: { args: { ...base, cells: [{ id: 'k', control: 'knob', x: 0, y: 0, w: 1, h: 1 }, { id: 'f', control: 'fader', param: 'cutoff', x: 1, y: 0, w: 1, h: 3 }] } },
  Missing: { args: { ...base, cells: [{ id: 'g', control: 'fader', param: 'gone', x: 0, y: 0, w: 1, h: 3 }, ...macroCells.filter((c) => c.x > 0)] } },
  Clipped: { args: { ...base, columns: 7 } },
  Learning: { args: { ...base, learning: true, mappings: { cutoff: 'CC 21 · ch 1' } } },
  Pending: { args: { ...base, learning: true, learnTarget: 'delay', mappings: { cutoff: 'CC 21 · ch 1' } } },
  Mapped: { args: { ...base, mappings: { cutoff: 'CC 21 · ch 1', drop: 'Note 36 · ch 10' } } },
});
