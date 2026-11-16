import { Tree } from '../../foundation/view/Tree';
import { barListView, type BarListModelProps } from './BarList.model';
import '../../primitives/Text/Text.css';
import './BarList.css';

// The props and the tree are framework-free, in the model; this file, `BarList.svelte` and
// `BarList.dom.ts` only hand the model's tree to their `Tree`.
export type { BarListModelProps } from './BarList.model';

export type BarListProps = BarListModelProps;

export function BarList(props: BarListProps) {
  return <Tree tree={barListView(props)} />;
}

export default BarList;
