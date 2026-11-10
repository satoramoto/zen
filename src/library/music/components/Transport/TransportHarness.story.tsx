import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../foundation/view/Tree';
import { viewState } from '../../../foundation/view/viewState';
import { initialTransportHost, transportHostHandlers, transportHostView, type TransportStoryArgs } from './TransportHarness.model';
import '../pressables.css';
import './Transport.css';

export function TransportHarness(props: TransportStoryArgs) {
  const [state] = useState(() => viewState(initialTransportHost(props)));
  const held = useSyncExternalStore(state.subscribe, state.get);
  return <Tree tree={transportHostView(props, held)} handlers={transportHostHandlers(props, held, state.get, state.set)} />;
}
