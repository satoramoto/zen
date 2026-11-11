// The Push area in Svelte: the same models and stores as `./index`, drawn by Svelte's Tree. The
// package's Svelte entry exposes it as the `Push` namespace. The device model is framework-free
// and comes with it.
import './registry.svelte';
import type { Component } from 'svelte';
import SurfaceBinding from './layouts/Surface/Surface.svelte';
import DisplayBinding from './layouts/Display/Display.svelte';
import DeviceBinding from './layouts/Device/Device.svelte';
import RearPanelBinding from './layouts/RearPanel/RearPanel.svelte';
import TraceBinding from './components/Trace/Trace.svelte';
import EmulatorBinding from './screens/Emulator/Emulator.svelte';
import type { SurfaceModelProps } from './layouts/Surface/Surface.model';
import type { DisplayModelProps } from './layouts/Display/Display.model';
import type { DeviceModelProps } from './layouts/Device/Device.model';
import type { RearPanelModelProps } from './layouts/RearPanel/RearPanel.model';
import type { TraceModelProps } from './components/Trace/Trace.model';
import type { EmulatorModelProps } from './screens/Emulator/Emulator.model';

export const Surface = SurfaceBinding as unknown as Component<SurfaceModelProps>;
export const Display = DisplayBinding as unknown as Component<DisplayModelProps>;
export const Device = DeviceBinding as unknown as Component<DeviceModelProps>;
export const RearPanel = RearPanelBinding as unknown as Component<RearPanelModelProps>;
export const Trace = TraceBinding as unknown as Component<TraceModelProps>;
export const Emulator = EmulatorBinding as unknown as Component<EmulatorModelProps>;
export type { SurfaceModelProps as SurfaceProps, DisplayModelProps as DisplayProps, DeviceModelProps as DeviceProps, RearPanelModelProps as RearPanelProps, TraceModelProps as TraceProps, EmulatorModelProps as EmulatorProps };
export type { EmulatorHandle } from './screens/Emulator/handle';
export * from './model';
