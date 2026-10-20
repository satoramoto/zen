// WaitingChip's stories as plain props: WaitingChip.stories.tsx draws them (in either renderer), and
// the tree snapshot records every one that draws something (`waitingChipDrawn`: every story but
// Empty, which renders nothing).
import { defineFixtures } from '../../fixtures';
import type { WaitingChipModelProps, WaitingHue } from './WaitingChip.model';

/** The story controls. */
export const waitingChipArgTypes = {
  label: { control: 'text' },
  hue: { control: 'select', options: ['intro', 'main', 'ending', 'brk', 'fill', 'a', 't'] },
  size: { control: 'inline-radio', options: ['count', 'line', 'display'] },
} as const;

/** The AllHues story's order and each hue's name. */
export const HUES: WaitingHue[] = ['intro', 'main', 'fill', 'brk', 'ending', 'a', 't'];
export const NAMES: Record<WaitingHue, string> = {
  intro: 'Intro II',
  main: 'Main C',
  fill: 'Fill B',
  brk: 'Break',
  ending: 'Ending III',
  a: 'Coastal Highway',
  t: 'Main D',
};

/** Every story that draws a chip. */
export const waitingChipDrawn = defineFixtures<WaitingChipModelProps>()({
  Board: { args: { label: 'Main C', hue: 'main', size: 'count' } },
  Display: { args: { label: 'Main C', hue: 't', size: 'display' } },
  QueuedStyle: { args: { label: 'Coastal Highway', hue: 'a', size: 'line' } },
  LongStyle: { args: { label: 'Coastal Highway Cruise Unplugged Ballad', hue: 'a', size: 'line' } },
  AllHues: { args: { label: 'Main C' }, items: HUES.map((hue) => ({ label: NAMES[hue], hue })) },
});

/** Every story, Empty (a blank label: nothing at all) included. */
export const waitingChipStories = defineFixtures<WaitingChipModelProps>()({
  ...waitingChipDrawn,
  Empty: { args: { label: '', hue: 'main', size: 'count' } },
});
