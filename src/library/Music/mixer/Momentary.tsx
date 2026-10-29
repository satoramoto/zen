import type { ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { momentaryHandlers, momentaryView, type MomentaryModelProps } from './Momentary.model';
import '../controls/pressables.css';

export interface MomentaryProps extends MomentaryModelProps { children?: ReactNode }
export function Momentary({ children, ...props }: MomentaryProps) {
  return <Tree tree={momentaryView(props)} handlers={momentaryHandlers(props)} slots={{ children }} />;
}
