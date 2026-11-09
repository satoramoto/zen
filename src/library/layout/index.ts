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
// The surface an app composes its DAW on: the document it owns, the pane kinds it defines, the
// intents every edit leaves as, and the Workspace that draws them (docs/live-workspace.md).
export {
  Workspace,
  DOCK_ZONES,
  SURFACE_DIRECTIONS,
  SURFACE_INTENTS,
  SURFACE_UI_REST,
  PLACEHOLDER_FORMS,
  applySurfaceIntent,
  cleanLayout,
  contentSlot,
  formForRoom,
  freshId,
  isSplit,
  leastRoom,
  leaves,
  openTab,
  readDocument,
  readTab,
  resolveSettings,
  resolveTarget,
  splits,
  surfaceUi,
  tabRegions,
  targetsFor,
  workspaceContent,
  type ApplyOptions,
  type DockZone,
  type JsonValue,
  type LayoutNode,
  type PaneDefinition,
  type ResolvedSettings,
  type SettingOption,
  type SettingSpec,
  type SettingValue,
  type SplitChild,
  type SplitNode,
  type SurfaceBinding,
  type SurfaceDirection,
  type SurfaceDocument,
  type SurfaceDocumentV1,
  type SurfaceDocumentV2,
  type SurfaceIntent,
  type SurfaceIntentType,
  type SurfaceRegion,
  type SurfaceTab,
  type SurfaceTabV1,
  type SurfaceTarget,
  type SurfaceUi,
  type WorkspaceModelProps,
  type WorkspacePane,
  type WorkspaceProps,
} from './Workspace/Workspace';
export { SURFACE_PLAYING, building, type SurfaceMode } from './Workspace/surfaceMode';
export { useSurfaceMode } from './Workspace/surfaceMode.react';
