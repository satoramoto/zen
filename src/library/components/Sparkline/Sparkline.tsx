import { Tree } from '../../foundation/view/Tree';
import { sparklineView, type SparklineModelProps } from './Sparkline.model';
import './Sparkline.css';

// The props and the tree are framework-free, in the model; this file, `Sparkline.svelte` and
// `Sparkline.dom.ts` only hand the model's tree to their `Tree`.
export type { SparklineModelProps } from './Sparkline.model';

export type SparklineProps = SparklineModelProps;

export function Sparkline(props: SparklineProps) {
  return <Tree tree={sparklineView(props)} />;
}

export default Sparkline;
