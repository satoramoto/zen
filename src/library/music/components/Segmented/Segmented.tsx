import { Tree } from '../../../foundation/view/Tree';
import { segmentedHandlers, segmentedView, type SegmentedModelProps } from './Segmented.model';
import '../pressables.css';

export { itemsOf } from './Segmented.model';
export type SegmentedProps = SegmentedModelProps;
export function Segmented(props: SegmentedProps) {
  return <Tree tree={segmentedView(props)} handlers={segmentedHandlers(props)} />;
}
