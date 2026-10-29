import type { ReactNode, Ref } from 'react';
import { Tree } from '../../view/Tree';
import { buttonFaceHandlers, buttonFaceView, type ButtonFaceModelProps } from './ButtonFace.model';
import './pressables.css';

export interface ButtonFaceProps extends ButtonFaceModelProps { children?: ReactNode; ref?: Ref<HTMLButtonElement> }
export function ButtonFace({ children, ref, ...props }: ButtonFaceProps) {
  return <Tree tree={buttonFaceView(props)} handlers={buttonFaceHandlers(props)} slots={{ children }} ref={ref} />;
}
