import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { viewState } from '../../view/viewState';
import { transportHandlers, transportView, type TransportModelProps, type TransportUnit } from './Transport.model';
import '../controls/pressables.css';
import './Transport.css';

export { clockText, positionText, type TransportLoop, type TransportTempo, type TransportNormalSpeed, type TransportPosition } from './Transport.model';
export interface TransportProps extends TransportModelProps { children?: ReactNode }

/** Playback, tempo and position. The host owns the engine; every part beyond play is optional. */
export function Transport({ children, ...props }: TransportProps) {
  const [state] = useState(() => viewState<TransportUnit>('beats'));
  const unit = useSyncExternalStore(state.subscribe, state.get);
  return <Tree tree={transportView(props, unit)} handlers={transportHandlers(props, state.set)} slots={{ children }} />;
}
