// HueLegend's stories as plain props: HueLegend.stories.tsx draws them with either renderer's
// `Tree`, and the tree snapshot prints every instance.
import { defineFixtures } from '../../fixtures';
import { PART_LEGEND, type HueLegendProps } from './HueLegend.model';

/** The controls, the same in both Storybooks. */
export const hueLegendArgTypes = {
  items: { control: 'object' },
  label: { control: 'text' },
} as const;

export const hueLegendStories = defineFixtures<HueLegendProps>()({
  Board: { args: { items: PART_LEGEND } },
  OverPads: { args: { items: PART_LEGEND } },
});
