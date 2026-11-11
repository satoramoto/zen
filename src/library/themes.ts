// `@satoramoto/zen/themes`: the theme packs, their facets and the theme scope's model, with no React
// and no Svelte. An app that only needs the themes (a skin, a server render, another framework's
// binding) imports this entry and reaches neither renderer. The React (`.`) and Svelte (`./svelte`)
// entries draw the same model.
//
// Sources: the packs and facets in `themes/`, the contract (`contract.ts`), resolving a choice
// (`resolve.ts`) and the scope element (`theme.model.ts`).
export { packs, type ThemePack } from './foundation/themes/packs';
export { palettes } from './foundation/themes/palettes';
export { faces } from './foundation/themes/faces';
export { scales } from './foundation/themes/scales';
export { materials } from './foundation/themes/materials';
/** The Push 3's lamp colour table (an index to a colour, set as `--push-lamp-N`) and its shades. */
export { LAMPS, LAMP_NEUTRAL, LAMP_SHADES, LAMP_SHADE_RULES, isLampIndex, lampColour, lampVar, lampVars, lampShadeCss, lampShadeHex, lampLuminance, type LampShade } from './foundation/themes/lamps';
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
  type InstrumentScheme,
  instrumentScheme,
  type Density,
} from './contract';
export { resolveTheme, FROM_THEME, type ThemeChoice } from './resolve';
export { scopeView, resolveMode, getSystemMode, subscribeSystemMode, type ModeChoice, type ScopeView } from './theme.model';
