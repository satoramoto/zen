import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../view/Tree';
import { viewState } from '../../view/viewState';
import { initialTransportHost, transportHostHandlers, transportHostView, type TransportStoryArgs } from './TransportHarness.model';
import '../controls/pressables.css';
import './Transport.css';

export function TransportHarness(props: TransportStoryArgs) {
  const [state] = useState(() => viewState(initialTransportHost(props)));
  const held = useSyncExternalStore(state.subscribe, state.get);
  return <Tree tree={transportHostView(props, held)} handlers={transportHostHandlers(props, held, state.get, state.set)} />;
}
