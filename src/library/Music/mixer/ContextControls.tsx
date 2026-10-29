import { useId, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { viewState } from '../../view/viewState';
import { contextControlsHandlers, contextControlsView, phonesIconView, powerIconView, type ContextControlsModelProps } from './ContextControls.model';
import '../controls/pressables.css';

export { phonesIconView, powerIconView } from './ContextControls.model';
export interface ContextControlsProps extends ContextControlsModelProps { children?: ReactNode; face?: ReactNode }
export function ContextControls({ children, face, ...props }: ContextControlsProps) {
  const [state] = useState(() => viewState(false));
  const open = useSyncExternalStore(state.subscribe, state.get);
  const id = useId();
  return <Tree tree={contextControlsView(props, { open, id })} handlers={contextControlsHandlers(props, state.set)} slots={{ children, face }} />;
}
export function PowerIcon() { return <Tree tree={powerIconView()} />; }
export function PhonesIcon() { return <Tree tree={phonesIconView()} />; }
