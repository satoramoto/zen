import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../view/Tree';
import { viewState } from '../../view/viewState';
import { parameterHostHandlers, parameterHostView, type ParameterHarnessProps, type ParameterHostState } from './KnobHarness.model';
export function ParameterHarness(props: ParameterHarnessProps) {
  const [state] = useState(() => viewState<ParameterHostState>({ given: props.value, value: props.value, depth: props.depth }));
  const value = useSyncExternalStore(state.subscribe, state.get);
  return <Tree tree={parameterHostView(props, value)} handlers={parameterHostHandlers(props, state.get, state.set)} />;
}
