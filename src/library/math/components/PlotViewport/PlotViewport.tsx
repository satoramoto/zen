import { Tree } from '../../../foundation/view/Tree';
import { plotViewportView, plotViewportHandlers, type PlotViewportProps } from './PlotViewport.model';
import '../../../primitives/Text/Text.css';
import './PlotViewport.css';
/** Controlled scientific viewport. Object IDs survive layout changes. Tuning knobs: none. */
export function PlotViewport(props:PlotViewportProps){return <Tree tree={plotViewportView(props)} handlers={plotViewportHandlers(props)}/>;}
export type { PlotViewportProps, PlotPoint, PlotCamera, PlotRegion } from './PlotViewport.model';
