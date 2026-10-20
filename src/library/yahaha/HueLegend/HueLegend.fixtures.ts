// HueLegend's stories as plain props: HueLegend.stories.tsx (React) and HueLegend.stories.svelte.ts
// (Svelte) both draw them, and the parity test renders every instance in both.
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
