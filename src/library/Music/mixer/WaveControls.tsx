import type { ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { waveControlsHandlers, waveControlsView, type WaveControlsProps as ModelProps } from './WaveControls.model';
import '../base.css';
import './mixer.css';

export type WaveControlsProps = ModelProps & { children: ReactNode };

export function WaveControls(props: WaveControlsProps) {
  return <Tree tree={waveControlsView(props)} handlers={waveControlsHandlers(props)} slots={{ children: props.children }} />;
}
