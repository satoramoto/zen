// `@satoramoto/zen/themes`: the theme packs, their facets and the theme scope's model, with no React
// and no Svelte. An app that only needs the themes (a skin, a server render, another framework's
// binding) imports this entry and reaches neither renderer. The React (`.`) and Svelte (`./svelte`)
// entries draw the same model.
//
// Sources: the packs and facets in `themes/`, the contract (`contract.ts`), resolving a choice
// (`resolve.ts`) and the scope element (`theme.model.ts`).
export { packs, type ThemePack } from './themes/packs';
export { palettes } from './themes/palettes';
export { faces } from './themes/faces';
export { scales } from './themes/scales';
export { materials } from './themes/materials';
export {
  toCssVars,
  LAYERS,
  type Mode,
  type Palette,
  type Faces,
  type Scale,
  type Materials,
  type Material,
  type Facets,
  type PackPrinciples,
  type LayerName,
  type Layer as LayerStyle,
  type LayerInk,
  type LayerAmbient,
  type Scheme,
  type Density,
} from './contract';
export { resolveTheme, FROM_THEME, type ThemeChoice } from './resolve';
export { scopeView, resolveMode, getSystemMode, subscribeSystemMode, type ModeChoice, type ScopeView } from './theme.model';
