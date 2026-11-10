// SendReadout's stories as plain props: SendReadout.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer), and the tree snapshot records `sendReadoutView` for every instance.
import { defineFixtures } from '../../../fixtures';
import type { SendReadoutModelProps } from './SendReadout.model';

/** The controls, the same in both Storybooks. */
export const sendReadoutArgTypes = {
  reverb: { control: { type: 'range', min: 0, max: 127, step: 1 } },
  chorus: { control: { type: 'range', min: 0, max: 127, step: 1 } },
  delay: { control: { type: 'range', min: 0, max: 127, step: 1 } },
  label: { control: 'text' },
  name: { control: 'text' },
  tip: { control: 'text' },
} as const;

/** Every story's base: the meta's data args. */
export const sendReadoutBase = { reverb: 40, chorus: 12, delay: 0, tip: 'display.band_sends' };

export const sendReadoutStories = defineFixtures<SendReadoutModelProps>()({
  Board: { args: { ...sendReadoutBase, reverb: 40, chorus: 12, delay: 0, label: 'Band' } },
  Full: { args: { ...sendReadoutBase, reverb: 127, chorus: 127, delay: 127 } },
  AllOff: { args: { ...sendReadoutBase, reverb: 0, chorus: 0, delay: 0 } },
});
