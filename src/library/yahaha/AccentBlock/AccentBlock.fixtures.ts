// AccentBlock's stories as plain props: AccentBlock.stories.tsx draws them (in either renderer),
// and the tree snapshot records the tree for every one.
import { defineFixtures } from '../../fixtures';
import type { AccentBlockModelProps } from './AccentBlock.model';

/** The story controls. */
export const accentBlockArgTypes = {
  label: { control: 'text' },
  empty: { control: 'text' },
  as: { control: 'inline-radio', options: ['span', 'button'] },
  size: { control: 'inline-radio', options: ['line', 'knob'] },
  width: { control: 'number' },
  name: { control: 'text' },
  tip: { control: 'text' },
} as const;

const LONG_NAME = 'Bossa Nova Lounge Session With Strings And Brushes Deluxe 2';

export const accentBlockStories = defineFixtures<AccentBlockModelProps>()({
  Board: {
    args: {
      label: 'Sunday Drive Pop',
      as: 'button',
      size: 'line',
      name: 'Sunday Drive Pop: open the Browser',
      empty: 'No style',
      tip: 'browser.open',
    },
  },
  LongName: { args: { label: LONG_NAME, as: 'button', width: 240, name: `${LONG_NAME}: open the Browser` } },
  Empty: { args: { label: '', as: 'button', empty: 'No style' } },
  BetweenSteps: { args: { label: 'Sunday Drive Pop', as: 'button', name: 'Sunday Drive Pop: open the Browser', chevron: false } },
  KnobPage: { args: { label: 'Style', size: 'knob', tip: 'browser.open' } },
  SwapR1: { args: { label: 'Swap R1', size: 'knob' } },
});
