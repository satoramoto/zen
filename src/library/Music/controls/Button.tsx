import type { ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { buttonHandlers, buttonView, type ButtonModelProps } from './Button.model';
import './pressables.css';

export interface ButtonProps extends ButtonModelProps { children?: ReactNode }
export function Button({ children, ...props }: ButtonProps) {
  return <Tree tree={buttonView(props)} handlers={buttonHandlers(props)} slots={{ children }} />;
}
