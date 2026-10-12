// Layout primitives: a Screen is a grid of Regions; a Region holds Groups of controls. The app
// decides arrangement; the theme's plate material decides how regions are drawn and spaced.
export { Screen, type ScreenProps } from './Screen';
export { Region, RegionView, type RegionProps, type RegionViewProps } from './Region';
export { Group, type GroupProps } from './Group';
export { Tabs, type TabsProps, type TabItem } from './Tabs';
// Stack, Opaque and Hole are primitives (../primitives); exporting them here too would clash in
// the library's `export *` of both folders. `Layer` is a deprecated alias of `<Surface layer>`.
export { Layer, type LayerProps } from './Layer';
// Self-assembling screens: forms, specs, principles and the solver (docs/assembly.md).
export * from './assembly';
