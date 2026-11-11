import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../foundation/view/Tree';
import { viewState } from '../../../foundation/view/viewState';
import { emulatorHandlers, emulatorView, type EmulatorModelProps, type EmulatorState } from './Emulator.model';
import '../../../primitives/Text/Text.css';
import './Emulator.css';

export type { EmulatorModelProps } from './Emulator.model';
export type { EmulatorHandle } from './handle';
export type EmulatorProps = EmulatorModelProps;

/**
 * A Push 3 emulator: the device, a stand-in host that answers it, a legend of the gestures and an
 * inspector of what the device asked.
 *
 * **Job.** Show the whole area working, and be where a developer starts. The stand-in host
 * (`model/host.ts`) keeps the Set and does the plain thing for each intent it knows; `host={false}`
 * refuses everything, which shows that the device draws only what the app gives.
 *
 * **For a script.** The root element carries `pushEmulator` (`getSet`, `change`, `intents`), so a
 * play or a console can act as the app.
 */
export function Emulator(props: EmulatorProps) {
  const [own] = useState(() => viewState<EmulatorState>({ set: props.set, log: [] }));
  const value = useSyncExternalStore(own.subscribe, own.get);
  return <Tree tree={emulatorView(props, value)} handlers={emulatorHandlers(props, own)} />;
}

export default Emulator;
