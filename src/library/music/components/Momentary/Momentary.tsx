import type { ReactNode } from 'react';
import { Tree } from '../../../foundation/view/Tree';
import { momentaryHandlers, momentaryView, type MomentaryModelProps } from './Momentary.model';
import '../pressables.css';

export interface MomentaryProps extends MomentaryModelProps { children?: ReactNode }
export function Momentary({ children, ...props }: MomentaryProps) {
  return <Tree tree={momentaryView(props)} handlers={momentaryHandlers(props)} slots={{ children }} />;
}
