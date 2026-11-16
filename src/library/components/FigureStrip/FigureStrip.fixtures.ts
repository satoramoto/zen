// FigureStrip's stories as plain props: FigureStrip.stories.tsx draws them with any renderer, and the tree
// snapshot records every one.
import { defineFixtures } from '../../fixtures';
import type { FigureStripModelProps } from './FigureStrip.model';

export const figureStripStories = defineFixtures<FigureStripModelProps>()({
  /** Today's figures, the first leading. */
  Today: {
    args: {
      lead: true,
      label: 'Today',
      figures: [
        { label: 'Coins in reach', value: '16', note: 'of 58 ranked', href: '#board' },
        { label: 'On the table', value: '$236k', note: 'a day' },
        { label: 'Hardware clearing 20%', value: '41', note: 'of 312 on offer' },
        { label: 'Yield 24h', value: '+4.7%', direction: 'up' },
        { label: 'Network', value: '−2.1%', direction: 'down', note: 'hashrate' },
      ],
    },
  },
  /** Even figures, no lead. */
  Even: { args: { figures: [{ label: 'Price', value: '$0.42' }, { label: 'Emission / day', value: '$2.64k' }] } },
});
