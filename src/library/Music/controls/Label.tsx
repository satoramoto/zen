import type { ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { dividerView, labelView, type DividerModelProps, type LabelModelProps } from './Label.model';
import './pressables.css';

export interface LabelProps extends LabelModelProps { children?: ReactNode }
export function Label({ children, ...props }: LabelProps) { return <Tree tree={labelView(props)} slots={{ children }} />; }
export function Divider(props: DividerModelProps) { return <Tree tree={dividerView(props)} />; }
