import { defineFixtures } from '../../fixtures';
import type { SegmentedModelProps } from './Segmented.model';

export const segmentedStories = defineFixtures<SegmentedModelProps>()({
  Default: { args: {} },
  Vertical: { args: { orientation: 'vertical' } },
  AccessibleGlyphs: { args: { items: ['s', 'b'], itemLabels: ['Seconds', 'Beats'], index: 0, label: 'Time unit', name: 'Time' } },
  Disabled: { args: { disabled: true } },
});
