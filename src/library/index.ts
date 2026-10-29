// The public entry of @satoramoto/zen: what apps import. `vite.lib.config.ts` builds it to
// `lib/index.js` (plus every stylesheet it imports in `lib/zen.css`), `tsconfig.lib.json` its types.
// The other entry is `@satoramoto/zen/storybook` (`storybook.tsx`).

// The token contract.
export {
  toCssVars,
  LAYERS,
  type Mode,
  type Scheme,
  type InstrumentScheme,
  instrumentScheme,
  type Palette,
  type Faces,
  type Scale,
  type Material,
  type Materials,
  type LayerName,
  // Renamed: `Layer` is the layout primitive below.
  type Layer as LayerStyle,
  type Facets,
  RANKS,
  SPACE_STEPS,
  type Rank,
  type Density,
  type PackPrinciples,
} from './contract';
export { AMBIENT_REGIONS, AMBIENT_VARS, AMBIENT_FALLBACKS, type AmbientRegion } from './contract';
/** Contract variables built per element by the scope stylesheet (library.css), not by `toCssVars`. */
export { SCOPE_VARS } from './contract';

// The theme: resolving a choice of facets and scoping its variables.
export { ThemeScope, useThemeScope, resolveTheme, useSystemMode, FROM_THEME, type ModeChoice, type ThemeChoice } from './theme';

// The facet lists.
export { packs, type ThemePack } from './themes/packs';
export { palettes } from './themes/palettes';
export { faces } from './themes/faces';
export { scales } from './themes/scales';
export { materials } from './themes/materials';

// Primitives: how a thing looks (Text, Surface, Icon, the rings, the spacing steps). See docs/tiers.md.
export * from './primitives';

// Layout: Stack and Group arrange controls, Regions are blocks, a Screen places them.
export * from './layout';

// Components: core controls any app builds with, and the music ones an instrument shows.
// Renamed in core: ActionButton's `ButtonFace` is `ActionButtonFace` (Button's face type keeps
// `ButtonFace`), and Param's `format` is `formatParam`.
export * from './components/core';
export * from './components/music';

// New reference-faithful music toolkit; the legacy component names above are not replaced.
export * as Music from './Music';

// The graph: the node-graph view (Graph, GraphNode, Port, Device, NodeSheet) and the Circuit model it draws.
export * from './graph';

// The shader graph (docs/shader-graph.md): materials authored as Circuits, compiled to GLSL and
// drawn by one shared WebGL2 context (ShaderCanvas, Surface's `shader`).
export * from './shader';

// The theme editor (docs/theme-editor.md): skins (a pack as portable JSON) and their helpers,
// SkinProvider/SkinScope to wear one, ThemePicker, ThemeEditor and ThemeSettings to change it.
export * from './theme-editor';

// The research report (docs/research-report.md): a plain-JSON market research report and the document that
// renders it (Report, Brief, Summary, Segments, Findings, LeadTable, Sources).
export * from './report';

// Dialog behaviour for an app's own overlays (a help sheet, a settings dialog) that aren't a Modal.
/** Esc closes a dialog unless an open menu inside it takes the key first; `useModal` is the whole dialog behaviour. */
export { closesOnKey, useModal } from './components/core/Modal/useModal';
/** Tab stays inside a dialog; `isTopTrap` says whether a trap is the topmost one, the one keys are for. */
export { useFocusTrap, isTopTrap } from './components/core/Modal/focusTrap';

/** The look a cluster asks of its controls: `CONTROL_TOOLBAR` (quiet) in a toolbar, `CONTROL_FIELD` (fields) in a panel that floats out of one. */
export { ControlContext, CONTROL_FIELD, CONTROL_TOOLBAR, useControlContext, type ControlContextValue } from './primitives/Stack';

/** The design window a Storybook frame draws a view at, or null in an app (`@satoramoto/zen/storybook` provides it). */
export { useFrameRoom, type StoryFrame, type StoryFrameParam } from './frame';

// Generic mathematical presentation and scientific viewports.
export * from "./math";
