// Source-compatible plain-data names for an existing saved widgets v1 theme. There is no
// ThemeRoot: the adapter produces a Zen skin and the enclosing Zen scope remains in charge.
export {
  MIXFLOW_DEFAULT_THEME as DEFAULT_THEME,
  MIXFLOW_PRESETS as PRESETS,
  MIXFLOW_DARK_SURFACES as DARK_SURFACES,
  MIXFLOW_DEFAULT_VARIATION as DEFAULT_VARIATION,
  MIXFLOW_ROLES as ROLES,
  MIXFLOW_SOURCE_ROLES as STEM_ROLES,
  mixflowColor as color,
  type MixflowTone as Tone,
  type MixflowReferenceTheme as Theme,
  type MixflowColorRole as ColorRole,
  type MixflowDeckVariation as DeckVariation,
} from '../../themes/mixflow-reference';
export { isMixflowTheme as isTheme } from './legacy';
