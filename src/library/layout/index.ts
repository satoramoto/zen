// Layout primitives: a Screen is a grid of Regions; a Region holds Groups of controls. The app
// decides arrangement; the theme's plate material decides how regions are drawn and spaced.
export { Screen, type ScreenProps } from './Screen';
export { Region, RegionView, type RegionProps, type RegionViewProps } from './Region';
export { Group, type GroupProps } from './Group';
export { Tabs, type TabsProps, type TabItem } from './Tabs';
