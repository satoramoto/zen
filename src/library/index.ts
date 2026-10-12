// The public entry of @satoramoto/zen: what apps import. `vite.lib.config.ts` builds it to `lib/`
// (JS, plus every imported stylesheet in `lib/zen.css`), `tsconfig.lib.json` its types.

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
} from './contract';

// The theme: resolving a choice of facets and scoping its variables.
export { ThemeScope, resolveTheme, useSystemMode, FROM_THEME, type ModeChoice, type ThemeChoice } from './theme';

// The facet lists.
export { packs, type ThemePack } from './themes/packs';
export { palettes } from './themes/palettes';
export { faces } from './themes/faces';
export { scales } from './themes/scales';
export { materials } from './themes/materials';

// Layout primitives.
export * from './layout';

// Components: export `./components/core` and `./components/music` here once those folders land.
