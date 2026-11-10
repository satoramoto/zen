// Transport's stories as plain props: Transport.stories.tsx draws them (React or Svelte, by the
// toolbar's Renderer).
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { TransportModelProps } from './Transport.model';

export const transportArgTypes = {
  playing: { control: 'boolean' },
  onPlay: { control: false },
  onStop: { control: false },
  disabled: { control: 'boolean' },
  loop: { control: 'object' },
  tempo: { control: 'object' },
  position: { control: 'object' },
  unit: { control: 'inline-radio', options: ['beats', 'seconds'] },
  onUnit: { control: false },
} as const;

type P = FixtureProps<TransportModelProps>;

const position = { seconds: 96, bar: 48.5, bars: 64 };

export const transportStories = defineFixtures<TransportModelProps>()({
  Default: {
    args: {
      playing: true,
      loop: { on: true, title: 'Loop the set' },
      tempo: { value: 112 },
      position,
    } as P,
  },
  EveryState: {
    items: [
      { playing: false, position: { seconds: 0, bar: 0, bars: 64 } },
      { playing: true, loop: { on: true }, tempo: { value: 112 }, position },
      { playing: true, loop: { on: false, partial: true, title: 'Looping the break' }, tempo: { value: 128 }, position: { seconds: 200, bar: 100, bars: 128 } },
      { playing: false, tempo: { value: 100 }, position: { seconds: 30 } },
    ] as P[],
  },
  Dense: { args: { playing: true, position } as P },
  Empty: { args: { playing: false, position: { seconds: 0 } } as P },
  Disabled: { args: { playing: false, disabled: true, position } as P },
});
