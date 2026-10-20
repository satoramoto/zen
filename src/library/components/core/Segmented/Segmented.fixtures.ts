// Segmented's stories as plain props: Segmented.stories.tsx draws them (with either renderer's
// `Tree`), and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { SegmentedModelProps } from './Segmented.model';

/** The controls. */
export const segmentedArgTypes = {
  index: { control: { type: 'number', min: 0 } },
  label: { control: 'text' },
  name: { control: 'text' },
  orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  disabled: { control: 'boolean' },
  title: { control: 'text' },
  hint: { control: 'text' },
} as const;

/** A filter type: every story starts from it. */
const filter: FixtureProps<SegmentedModelProps> = { items: ['LP', 'BP', 'HP'], index: 0, label: 'Filter' };

export const segmentedStories = defineFixtures<SegmentedModelProps>()({
  Horizontal: { args: filter },
  Vertical: { args: { ...filter, items: ['up', 'down', 'up-down', 'random'], index: 2, label: 'Direction', name: 'Direction', orientation: 'vertical' } },
  ItemLabels: { args: { ...filter, items: ['s', 'bar', 'beat'], itemLabels: ['seconds', 'bars', 'beats'], index: 1, label: 'Unit' } },
  Captioned: { args: { ...filter, name: 'Filter', label: undefined } },
  Disabled: { args: { ...filter, disabled: true, index: 1 } },
  /** The themed stories draw the plain filter under each theme (the stories set the theme). */
  Themed: { args: filter },
  VisualsUnderline: { args: { ...filter, items: ['Home', 'Live'], index: 0, label: 'View' } },
});
