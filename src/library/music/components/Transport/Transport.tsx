import { useState, useSyncExternalStore, type ReactNode } from 'react';
import { useForm } from '../../../layouts/Assembly';
import { Tree } from '../../../foundation/view/Tree';
import { viewState } from '../../../foundation/view/viewState';
import { TRANSPORT_FORMS } from './Transport.forms';
import { transportHandlers, transportView, type TransportModelProps, type TransportUnit } from './Transport.model';
import '../pressables.css';
import './Transport.css';

export { TEMPO_PARAM, TRANSPORT_UNITS, clockText, positionText, readingText, type TransportUnit, type TransportLoop, type TransportTempo, type TransportNormalSpeed, type TransportPosition } from './Transport.model';
export { TRANSPORT_FORMS, type TransportForm } from './Transport.forms';
export interface TransportProps extends TransportModelProps { children?: ReactNode }

/**
 * Playback, tempo and position. The host owns the engine; every part beyond play is optional.
 * Forms (`Transport.forms`): `bar`, the whole row, and `compact`, play and the reading alone.
 */
export function Transport({ children, ...props }: TransportProps) {
  const [state] = useState(() => viewState<TransportUnit>('beats'));
  const unit = useSyncExternalStore(state.subscribe, state.get);
  const form = useForm(TRANSPORT_FORMS);
  return <Tree tree={transportView(props, unit, form)} handlers={transportHandlers(props, state.set, state.get)} slots={{ children }} />;
}

Transport.forms = TRANSPORT_FORMS;
