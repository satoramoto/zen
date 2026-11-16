// BarList's stories as plain props: BarList.stories.tsx draws them with any renderer, and the tree
// snapshot records every one.
import { defineFixtures } from '../../fixtures';
import type { BarListModelProps } from './BarList.model';

export const barListStories = defineFixtures<BarListModelProps>()({
  /** On the table by algorithm, most first, each linking to its group. */
  Ranked: {
    args: {
      label: 'On the table by algorithm',
      items: [
        { name: 'KeryxHashH6', value: 2640, display: '$2.64k', note: '3 of 4 in reach', href: '#keryx' },
        { name: 'Pearl', value: 1320, display: '$1.32k', note: '1 of 1 in reach', href: '#pearl' },
        { name: 'RandomX', value: 101, display: '$101', note: '5 of 9 in reach', href: '#randomx' },
        { name: 'FishHash', value: 0.4, display: '$0.40', note: '1 of 2 in reach' },
      ],
    },
  },
  /** Plain names, no notes. */
  Plain: { args: { items: [{ name: 'CPU', value: 30 }, { name: 'GPU', value: 90 }] } },
});
