import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../view/Tree';
import { viewState } from '../../view/viewState';
import { numberFieldHandlers, numberFieldView, type NumberFieldProps } from './NumberField.model';
import './parameters.css';
export type { NumberFieldProps } from './NumberField.model';
export function NumberField(props: NumberFieldProps) {
  const [draft] = useState(() => viewState<string | null>(null));
  const typed = useSyncExternalStore(draft.subscribe, draft.get);
  return <Tree tree={numberFieldView(props, typed)} handlers={numberFieldHandlers(props, draft.set)} />;
}
