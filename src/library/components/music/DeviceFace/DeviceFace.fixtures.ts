// DeviceFace's stories as plain props, plus the params slot's sample as a view subtree:
// DeviceFace.stories.tsx draws the face as a component node (`treeStory`), so the toolbar's
// Renderer draws it with React's or Svelte's `Tree`.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import { component } from '../../../view/Tree.model';
import type { DeviceFaceModelProps } from './DeviceFace.model';

/** The controls, the same in both Storybooks. */
export const deviceFaceArgTypes = {
  name: { control: 'text' },
  on: { control: 'boolean' },
  folded: { control: 'boolean' },
  selected: { control: 'boolean' },
  disabled: { control: 'boolean' },
  withParams: { control: 'boolean' },
  onToggle: { control: false },
  onFold: { control: false },
  onSelect: { control: false },
  onParam: { control: false },
} as const;

/** A story's data: the face's props, whether the params slot fills, and the param spy. */
export type DeviceFaceStoryProps = FixtureProps<DeviceFaceModelProps> & {
  withParams?: boolean;
  onParam?: (id: string, value: number) => void;
};

/** The params slot's sample: two knobs and a mix line, as component nodes. */
export const deviceParamsSample = [
  component('Knob', { label: 'Time', value: '1/8', fraction: 0.4, hue: 2 }, { on: { onstep: 'time' }, key: 'time' }),
  component('Knob', { label: 'Feedback', value: '62%', fraction: 0.62, hue: 2 }, { on: { onstep: 'feedback' }, key: 'feedback' }),
  component('LineSlider', { value: 0.7, min: 0, max: 1, step: 0.01, name: 'Mix' }, { on: { onchange: 'mix' }, key: 'mix' }),
];

type P = DeviceFaceStoryProps;

export const deviceFaceStories = defineFixtures<P>()({
  Default: { args: { name: 'FX A Delay', on: true, withParams: true } },
  EveryState: {
    items: [
      { name: 'FX A Delay', on: true, selected: true, withParams: true },
      { name: 'FX B Reverb', on: true, withParams: true },
      { name: 'Filter', on: false, withParams: true },
      { name: 'Folded drive', on: true, folded: true, withParams: true },
    ] as P[],
  },
  Dense: { args: { name: 'FX A Delay', on: true, withParams: true } },
  Empty: { args: { name: 'No device', on: false } },
  Disabled: { args: { name: 'FX A Delay', on: true, withParams: true, disabled: true } },
});
