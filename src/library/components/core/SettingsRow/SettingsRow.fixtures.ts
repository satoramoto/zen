// SettingsRow's stories as plain data: SettingsRow.stories.tsx (React) and SettingsRow.stories.svelte.ts
// (Svelte) both draw them, and the parity test renders every row in both. A row's control is a React
// node or a Svelte snippet, so the fixtures hold the row's own props (`settingsRowStories`) and,
// beside them, the stand-in control each story puts in it (`controlArgs`, `storyControls`).
// Every row passes an explicit `id`, so the two renderers' generated ids never differ.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { SettingsRowModelProps } from './SettingsRow.model';

export type Control = 'lamp' | 'tabs' | 'slider' | 'none';
export type Tab = { id: string; label: string; tip?: string };

/** The stand-in control's data args (each Storybook adds its own `ontoggle`, `onchoose`, `onchange` spies). */
export interface ControlArgs {
  control: Control;
  lampLabel: string;
  lampOn: boolean;
  lampDisabled: boolean;
  lampTip?: string;
  tabs: Tab[];
  tabsChosen: string;
  tabsLabel: string;
  sliderValue: number;
  sliderMax: number;
  sliderUnit: string;
  sliderTip?: string;
}

export const MAIN_TIMING: Tab[] = [
  { id: 'immediate', label: 'Immediate', tip: 'settings.section_timing' },
  { id: 'nextBar', label: 'Next bar', tip: 'settings.section_timing' },
];

/** The stand-in control's defaults, under every story. */
export const controlArgs: ControlArgs = {
  control: 'lamp',
  lampLabel: 'On',
  lampOn: true,
  lampDisabled: false,
  tabs: MAIN_TIMING,
  tabsChosen: 'nextBar',
  tabsLabel: 'Main timing',
  sliderValue: 10,
  sliderMax: 30,
  sliderUnit: 'ms',
  sliderTip: 'settings.chord_settle',
};

/** The controls, the same in both Storybooks: the row's props, then the stand-in's, grouped by control. */
export const settingsRowArgTypes = {
  label: { control: 'text' },
  hint: { control: 'text' },
  labelWidth: { control: 'number' },
  id: { control: 'text' },
  control: { control: 'inline-radio', options: ['lamp', 'tabs', 'slider', 'none'], table: { category: 'children' } },
  lampLabel: { control: 'text', table: { category: 'Lamp' } },
  lampOn: { control: 'boolean', table: { category: 'Lamp' } },
  lampDisabled: { control: 'boolean', table: { category: 'Lamp' } },
  lampTip: { control: 'text', table: { category: 'Lamp' } },
  ontoggle: { table: { category: 'Lamp' } },
  tabs: { control: 'object', table: { category: 'Tabs' } },
  tabsChosen: { control: 'select', options: ['immediate', 'nextBar'], table: { category: 'Tabs' } },
  tabsLabel: { control: 'text', table: { category: 'Tabs' } },
  onchoose: { table: { category: 'Tabs' } },
  sliderValue: { control: 'number', table: { category: 'Slider' } },
  sliderMax: { control: 'number', table: { category: 'Slider' } },
  sliderUnit: { control: 'text', table: { category: 'Slider' } },
  sliderTip: { control: 'text', table: { category: 'Slider' } },
  onchange: { table: { category: 'Slider' } },
} as const;

const upper: FixtureProps<SettingsRowModelProps> = { id: 'upper', label: 'Upper', hint: 'Chords from the right hand', labelWidth: 120 };

export const settingsRowStories = defineFixtures<SettingsRowModelProps>()({
  Board: { args: upper },
  DisabledLamp: { args: { ...upper, id: 'manual-bass', label: 'Manual Bass', hint: 'Works with Upper on' } },
  Tabs: { args: { ...upper, id: 'main-timing', label: 'Main timing', hint: '' } },
  Slider: { args: { ...upper, id: 'chord-settle', label: 'Chord settle', hint: '' } },
  LongLabel: {
    args: { ...upper, id: 'fingered', label: 'Fingered on bass with split', hint: 'Lowest note of the left hand sets the bass, the rest the chord' },
  },
  // A Settings page's stack, one row per item; `STACK_CONTROLS` holds each row's stand-in.
  Stack: {
    items: [
      { id: 'upper', label: 'Upper', hint: 'Chords from the right hand' },
      { id: 'manual-bass', label: 'Manual Bass', hint: 'Works with Upper on' },
      { id: 'main-timing', label: 'Main timing' },
      { id: 'chord-settle', label: 'Chord settle', hint: 'Wait before reading the chord' },
      { id: 'pedal', label: 'Pedal', hint: 'Fader button 7' },
    ],
  },
});

/** Each story's stand-in control, over `controlArgs`. */
export const storyControls: Record<keyof typeof settingsRowStories, Partial<ControlArgs>> = {
  Board: {},
  DisabledLamp: { lampOn: false, lampDisabled: true },
  Tabs: { control: 'tabs' },
  Slider: { control: 'slider' },
  LongLabel: {},
  Stack: {},
};

/** The Stack story's stand-ins, one per row of `settingsRowStories.Stack.items`. */
export const STACK_CONTROLS: Partial<ControlArgs>[] = [
  { control: 'lamp' },
  { control: 'lamp', lampOn: false, lampDisabled: true },
  { control: 'tabs' },
  { control: 'slider' },
  { control: 'none' },
];
