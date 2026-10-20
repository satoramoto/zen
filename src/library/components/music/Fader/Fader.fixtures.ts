// Fader's stories as plain props: Fader.stories.tsx (React) and Fader.stories.svelte.ts (Svelte)
// both draw them, and parity.test.tsx renders every instance in both.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { FaderModelProps } from './Fader.model';

const NONE = 'none';

/** The controls, the same in both Storybooks. */
export const faderArgTypes = {
  name: { control: 'text' },
  value: { control: 'text' },
  level: { control: { type: 'range', min: 0, max: 127, step: 1 } },
  meter: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  meter2: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  peak: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  away: {
    control: 'select',
    options: [NONE, 0, 32, 50, 64, 100, 127],
    mapping: { [NONE]: undefined },
  },
  kind: { control: 'select', options: ['part', 'group', 'master', 'off', 'parked'] },
  hue: { control: 'select', options: [1, 2, 3, 4, 5, 'a', 't2', 't'] },
  layered: { control: 'boolean' },
  width: { control: 'number' },
  fillHeight: { control: 'boolean' },
  tip: { control: 'text' },
} as const;

type P = FixtureProps<FaderModelProps>;

/** Right 1 on the board: every story starts from these args. */
export const faderBoard: P = {
  name: 'Right 1 · Stage Grand, level 90',
  value: '90',
  level: 90,
  meter: 0.62,
  meter2: 0.58,
  peak: 0.7,
  kind: 'part',
  hue: 1,
  layered: false,
  width: 66,
  tip: 'mixer.panel.right1',
};

const away: P = {
  name: 'Right 2 · Silk Strings, level 72, hardware fader away (soft takeover)',
  value: '72',
  level: 72,
  meter: 0.45,
  meter2: 0.42,
  peak: 0.55,
  hue: 2,
  away: 50,
};
const off: P = { name: 'Right 3 · Brass Section, level 64', value: '64', level: 64, meter: 0, meter2: 0, peak: 0, kind: 'off', hue: 3 };
const group: P = { name: 'Style volume, level 100', value: '100', level: 100, meter: 0.7, meter2: 0.65, peak: 0.78, kind: 'group', hue: 'a' };
const master: P = { name: 'Master, level 100', value: '100', level: 100, meter: 0.72, meter2: 0.67, peak: 0.8, kind: 'master', hue: 't' };
const parked: P = { name: 'Fader 7 unused', value: '', level: 0, meter: 0, meter2: 0, peak: 0, kind: 'parked', hue: 't' };

export const faderStories = defineFixtures<FaderModelProps>()({
  Board: { args: faderBoard },
  Away: { args: { ...faderBoard, ...away } },
  Off: { args: { ...faderBoard, ...off } },
  Group: { args: { ...faderBoard, ...group } },
  Master: { args: { ...faderBoard, ...master } },
  Parked: { args: { ...faderBoard, ...parked } },
  Layered: { args: { ...faderBoard, name: 'Right 1 · Stage Grand, Rev 40', value: 'Rev 40', level: 40, layered: true } },
  Empty: {
    args: { ...faderBoard, name: 'Left · no voice', value: '', level: 0, meter: 0, meter2: 0, peak: 0, kind: 'parked', hue: 4, empty: true },
  },
  AwayAbove: { args: { ...faderBoard, ...away, name: 'Right 2 · Silk Strings, level 72, hardware fader away above', away: 110 } },
  Strip: {
    args: faderBoard,
    items: [
      {},
      away,
      off,
      { name: 'Left · Bass, level 80', value: '80', level: 80, hue: 4, meter: 0.5, meter2: 0.48, peak: 0.6 },
      group,
      master,
      parked,
    ],
  },
  FillHeight: { args: { ...faderBoard, fillHeight: true } },
  Live: { args: faderBoard },
});
