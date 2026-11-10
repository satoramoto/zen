import { useId, useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../foundation/view/Tree';
import { viewState } from '../../../foundation/view/viewState';
import { SELECT_CLOSED, selectHandlers, selectView, type SelectModelProps } from './Select.model';
import '../pressables.css';

export type SelectProps = SelectModelProps;
export function Select(props: SelectProps) {
  const [state] = useState(() => viewState(SELECT_CLOSED));
  const view = useSyncExternalStore(state.subscribe, state.get);
  const id = useId();
  return <Tree tree={selectView(props, { ...view, id })} handlers={selectHandlers(props, state.set)} />;
}
