import { Tree } from '../../../view/Tree';
import { distributionPlotHandlers, distributionPlotView, type DistributionPlotProps } from './DistributionPlot.model';
import '../../../primitives/Text.css';
import './DistributionPlot.css';
export function DistributionPlot(props: DistributionPlotProps) {
  return <Tree tree={distributionPlotView(props)} handlers={distributionPlotHandlers(props)} />;
}
export type { DistributionBin, DistributionPlotProps } from './DistributionPlot.model';
