import { Tree } from '../../foundation/view/Tree';
import { figureStripView, type FigureStripModelProps } from './FigureStrip.model';
import '../../primitives/Text/Text.css';
import './FigureStrip.css';

// The props and the tree are framework-free, in the model; this file, `FigureStrip.svelte` and
// `FigureStrip.dom.ts` only hand the model's tree to their `Tree`.
export type { FigureStripModelProps } from './FigureStrip.model';

export type FigureStripProps = FigureStripModelProps;

export function FigureStrip(props: FigureStripProps) {
  return <Tree tree={figureStripView(props)} />;
}

export default FigureStrip;
