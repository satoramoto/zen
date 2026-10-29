import type { ReactNode, Ref } from 'react';
import { Tree } from '../../view/Tree';
import { widgetView, type WidgetModelProps } from './Widget.model';
import './parameters.css';
export type { WidgetLayout, WidgetProps, WidgetSide, WidgetVars } from './Widget.model';
export interface WidgetSlots extends Omit<WidgetModelProps, 'readout'> {
  readout?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
}
export function Widget({ children, readout, ref, ...props }: WidgetSlots) {
  return <Tree tree={widgetView(props, undefined, { readout: readout !== undefined })} slots={{ children, readout }} ref={ref} />;
}
