// The theme editor: skins (a theme pack as portable JSON), the picker that lists every pack, the
// editor that changes a skin facet by facet, and the scope that wears one. docs/theme-editor.md.
// skin.ts, colour.ts and persist.ts have no React; the components bind them.
export {
  SKIN_FORMAT,
  SKIN_VERSION,
  FACET_NAMES,
  FACET_LISTS,
  SHADER_NAMES,
  skinFromPack,
  applyOverrides,
  baseFacets,
  resolveSkin,
  isCustom,
  validateSkin,
  normalizeSkin,
  serializeSkin,
  parseSkin,
  getOverride,
  valueAt as skinValueAt,
  setOverride,
  clearOverride,
  swapFacet,
  resetFacet,
  rebaseSkin,
  type Skin,
  type SkinOverrides,
  type SchemeOverrides,
  type SkinResult,
  type FacetName,
  type ShaderName,
  type OverridePath,
} from './skin';
export { hexToHsl, hslToHex, contrast, distance as colourDistance, paletteWarnings, isHex, type Hsl } from './colour';
export { loadSkin, saveSkin, forgetSkin, type SkinStorage } from './persist';
export { SkinScope, SkinProvider, useSkin, type SkinProviderProps, type SkinContextValue } from './SkinScope';
