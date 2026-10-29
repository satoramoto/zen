// SendBars' stories as plain props: SendBars.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer).
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { SendBarsModelProps } from './SendBars.model';

export const sendBarsArgTypes = {
  sends: { control: 'object' },
  names: { control: 'object' },
  hues: { control: 'object' },
  onSend: { control: false },
  disabled: { control: 'boolean' },
} as const;

type P = FixtureProps<SendBarsModelProps>;

export const sendBarsStories = defineFixtures<SendBarsModelProps>()({
  Default: { args: { sends: [0.4, 0.75], hues: [1, 2] } },
  EveryState: {
    items: [
      { sends: [0, 0] },
      { sends: [0.4, 0.75], hues: [1, 2] },
      { sends: [1, 1], hues: [3, 4] },
      { sends: [0.75, 0.2], names: ['Delay', 'Verb'] as unknown as [string, string], hues: [5, 1] },
    ] as P[],
  },
  Dense: { args: { sends: [0.6, 0.3], hues: [2, 3] } },
  Empty: { args: { sends: [0, 0] } },
  Disabled: { args: { sends: [0.4, 0.75], disabled: true } },
});
