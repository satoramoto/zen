// A small screen for the assembly tests and the story: a bar, then what's playing beside a
// sidebar, then the pads. Every need is in control heights and space steps. Below it, the
// Assembly stories as plain data: Assembly.stories.tsx (React) and Assembly.stories.svelte.ts
// (Svelte) both draw them, and parity.test.tsx renders each story's screen (empty slots) in both.
import { defineFixtures } from '../../fixtures';
import type { ScreenModelProps } from '../Screen.model';
import type { Forms, ScreenSpec } from './types';

export const NOW_FORMS: Forms<'full' | 'compact'> = [
  { id: 'full', min: { w: { control: 10 }, h: { control: 6 } }, ideal: { w: { control: 14 }, h: { control: 7 } }, grow: { w: true } },
  { id: 'compact', min: { w: { control: 8 }, h: { control: 3 } }, ideal: { w: { control: 10 }, h: { control: 4 } }, grow: { w: true } },
];

export const SIDE_FORMS: Forms<'docked' | 'rail'> = [
  { id: 'docked', min: { w: { control: 8 }, h: { control: 4 } }, ideal: { w: { control: 10 }, h: { control: 6 } } },
  { id: 'rail', min: { w: { control: 2 }, h: { control: 2 } }, ideal: { w: { control: 2 }, h: { control: 2 } } },
];

export const PAD_FORMS: Forms<'two-rows' | 'one-row'> = [
  {
    id: 'two-rows',
    min: { w: { control: 8 }, h: { control: 4, space: 2 } },
    ideal: { w: { control: 16 }, h: { control: 5 } },
    grow: { w: true, h: true },
  },
  { id: 'one-row', min: { w: { control: 8 }, h: { control: 2 } }, ideal: { w: { control: 16 }, h: { control: 2.5 } }, grow: { w: true } },
];

export const DEMO_SPEC: ScreenSpec = {
  header: [{ id: 'bar', plate: false, priority: 'chrome', forms: [{ id: 'bar', min: { w: 0, h: { control: 1 } }, ideal: { w: 0, h: { control: 1 } } }] }],
  rows: [
    [
      { id: 'now', priority: 'now', forms: NOW_FORMS },
      { id: 'side', priority: 'context', forms: SIDE_FORMS },
    ],
    [{ id: 'pads', priority: 'controls', forms: PAD_FORMS }],
  ],
};

/* ---------- the stories ---------- */

/** The demo's aspect: none, locked to 16:9 (`contain` steps forms down), or scaled (`scale` draws the 1600 × 900 design smaller). */
export type DemoAspect = 'none' | 'contain' | 'scale';

/** The demo screen for each aspect. */
export const DEMO_SPECS: Record<DemoAspect, ScreenSpec> = {
  none: DEMO_SPEC,
  contain: { ...DEMO_SPEC, aspect: { ratio: 16 / 9, fit: 'contain' } },
  scale: { ...DEMO_SPEC, aspect: { ratio: 16 / 9, fit: 'scale', design: { w: 1600, h: 900 } } },
};

/** The stories' controls: the frame (the room) and the aspect. */
export interface DemoArgs {
  width: number;
  height: number;
  aspect: DemoAspect;
}

export const demoArgs: DemoArgs = { width: 900, height: 420, aspect: 'none' };

export const demoArgTypes = {
  width: { control: { type: 'range', min: 320, max: 1600, step: 10 } },
  height: { control: { type: 'range', min: 140, max: 1000, step: 10 } },
  aspect: { control: 'inline-radio', options: ['none', 'contain', 'scale'] },
} as const;

/** Each story's args over `demoArgs`. */
export const demoStoryArgs = {
  Resizable: {},
  Board: { width: 1440, height: 900 },
  Short: { width: 900, height: 330 },
  Small: { width: 600, height: 240 },
  AspectLocked: { width: 1100, height: 420, aspect: 'contain' },
  AspectScaled: { width: 700, height: 600, aspect: 'scale' },
} satisfies Record<string, Partial<DemoArgs>>;

export const DEMO_NAME = 'Assembly demo';

/** The parity fixtures: each story's assembled Screen at its frame's size (the room given, the slots empty). */
export const assemblyStories = defineFixtures<ScreenModelProps>()(
  Object.fromEntries(
    Object.entries(demoStoryArgs).map(([story, over]) => {
      const { width, height, aspect } = { ...demoArgs, ...over } as DemoArgs;
      return [story, { args: { name: DEMO_NAME, spec: DEMO_SPECS[aspect], room: { w: width, h: height } } }];
    }),
  ) as Record<keyof typeof demoStoryArgs, { args: ScreenModelProps }>,
);
