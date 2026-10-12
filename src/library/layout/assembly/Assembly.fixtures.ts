// A small screen for the assembly tests and the story: a bar, then what's playing beside a
// sidebar, then the pads. Every need is in control heights and space steps.
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
