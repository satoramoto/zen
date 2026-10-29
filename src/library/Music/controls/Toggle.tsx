import type { ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { toggleHandlers, toggleView, type ToggleModelProps } from './Toggle.model';
import './pressables.css';

export interface ToggleProps extends ToggleModelProps { children?: ReactNode }
export function Toggle({ children, ...props }: ToggleProps) {
  return <Tree tree={toggleView(props, children !== undefined)} handlers={toggleHandlers(props)} slots={{ children }} />;
}
