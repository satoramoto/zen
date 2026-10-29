import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../view/Tree';
import { viewState } from '../../view/viewState';
import { pressableHostHandlers, pressableHostInitial, pressableHostView, type PressableHarnessProps } from './ToggleHarness.model';
import { Toggle } from './Toggle';
import { Segmented } from './Segmented';
import { Select } from './Select';
import { Momentary } from '../mixer/Momentary';
import { pressableHostStores } from './ToggleHarness.input';
import './pressables.css';

// Story-only renderer plumbing, not another production registry.
const components = { MusicToggle: Toggle, MusicSegmented: Segmented, MusicSelect: Select, MusicMomentary: Momentary };
export function PressableHarness(props: PressableHarnessProps) {
  const [state] = useState(() => viewState(pressableHostInitial(props)));
  const view = useSyncExternalStore(state.subscribe, state.get);
  return <Tree tree={pressableHostView(props, view)} handlers={pressableHostHandlers(props, state.get, state.set)} stores={pressableHostStores} components={name => components[name as keyof typeof components]} />;
}
