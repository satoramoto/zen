import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../foundation/view/Tree';
import { createDevice } from '../../model/device';
import { deviceHandlers, deviceView, type DeviceModelProps } from './Device.model';

// The props and the tree are framework-free, in the model; this file and `Device.svelte` only
// hand its tree to their `Tree`, with the device's own state as their view state.
export type { DeviceModelProps } from './Device.model';
export type DeviceProps = DeviceModelProps;

/**
 * The Push 3, working: the surface driven by the device model.
 *
 * **Job.** Be the device for an app that does not want to hold its state. It is given the app's
 * Set and reports intents (`onIntent`): what the device asks of the app. It keeps the device's
 * own state (modes, what is held, highlights), gives every input to the model, and gives itself
 * time when a hold matures.
 *
 * **What it never does.** Change the Set. A press of Mute lights nothing until the app gives a
 * Set in which the track is muted.
 *
 * An app that wants to hold the state itself uses `Surface` with `step` and `project`
 * (`@satoramoto/zen/push/model`) instead.
 */
export function Device(props: DeviceProps) {
  const [device] = useState(() => createDevice({ set: props.set, state: props.initialState }));
  const { state } = useSyncExternalStore(device.subscribe, device.get);
  return <Tree tree={deviceView(props, state, performance.now())} handlers={deviceHandlers(props, device)} />;
}

export default Device;
