// The public entry of @satoramoto/zen: what apps import. `vite.lib.config.ts` builds it to
// `lib/index.js` (plus every stylesheet it imports in `lib/zen.css`), `tsconfig.lib.json` its types.
// visual[flow]'s app is the second entry, `@satoramoto/zen/visuals` (`visuals/index.ts`).

// The token contract.
export {
  toCssVars,
  LAYERS,
  type Mode,
  type Scheme,
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
