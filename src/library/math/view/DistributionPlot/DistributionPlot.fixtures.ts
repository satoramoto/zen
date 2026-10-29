import { defineFixtures } from '../../../fixtures';
import type { DistributionPlotProps } from './DistributionPlot.model';
export const distributionPlotStories = defineFixtures<DistributionPlotProps>()({
  Uniform: { args: { label: 'Multiples of three by interval', hue: 1, startLabel: '1', endLabel: '3,200', bins: Array.from({ length: 32 }, (_, i) => ({ id: String(i), label: `${i * 100 + 1}–${(i + 1) * 100}`, count: i % 3 === 2 ? 34 : 33, total: 100 })) } },
  Uneven: { args: { label: 'Matching share by interval', hue: 2, selectedId: '2', bins: [{ id: '0', label: '1–100', count: 0, total: 100 }, { id: '1', label: '101–200', count: 25, total: 100 }, { id: '2', label: '201–300', count: 100, total: 100 }, { id: '3', label: '301–400', count: 50, total: 100 }] } },
  Empty: { args: { label: 'Empty distribution', bins: [] } },
  Unavailable: { args: { label: 'Missing observations', bins: [{ id: 'empty', label: '1–100', count: 0, total: 0 }] } },
});
