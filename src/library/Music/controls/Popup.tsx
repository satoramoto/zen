import type { ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { popupHandlers, popupView, type PopupModelProps } from './Popup.model';
import './pressables.css';

export type { Dismissal, PopupAnchor, PopupBox, PopupWithin } from './Popup.model';
export interface PopupProps extends PopupModelProps { children?: ReactNode }
export function Popup({ children, ...props }: PopupProps) {
  return <Tree tree={popupView(props)} handlers={popupHandlers(props)} slots={{ children }} />;
}
