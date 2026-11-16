// Sparkline's stories as plain props: Sparkline.stories.tsx draws them with any renderer, and the tree
// snapshot records every one.
import { defineFixtures } from '../../fixtures';
import type { SparklineModelProps } from './Sparkline.model';

export const sparklineStories = defineFixtures<SparklineModelProps>()({
  /** A rising line with its end dot. */
  Up: { args: { values: [3, 4, 3.5, 5, 6, 5.5, 7], label: 'KRX yield, 7 days' } },
  /** A falling line with an area under it. */
  Down: { args: { values: [9, 8, 8.5, 6, 5, 5.2, 4], label: 'PRL yield, 7 days', area: true } },
  /** Level: quiet. */
  Flat: { args: { values: [2, 3, 1, 2], label: 'EPIC yield, 4 days', dot: false } },
  /** One reading: just the dot. */
  Single: { args: { values: [4], label: 'New coin' } },
});
