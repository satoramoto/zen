import type { ReactNode } from 'react';
import { Tree } from '../view/Tree';
import { musicScopeView, type MusicScopeProps } from './Scope.model';
import './base.css';

export function Scope({ children, ...props }: MusicScopeProps & { children?: ReactNode }) {
  return <Tree tree={musicScopeView(props)} slots={{ children }} />;
}
