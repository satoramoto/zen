// Primitives: how a thing looks. Text in a role, a Surface (a layer, a material), an Icon, the
// focus and press rings, and the spacing steps groups name. They build only from the tokens.
export {
  Text,
  TEXT_ROLES,
  TEXT_TONES,
  TEXT_LEADINGS,
  TEXT_WEIGHTS,
  TEXT_CASES,
  toneAttr,
  type TextProps,
  type TextRole,
  type TextTone,
  type TextLeading,
  type TextWeight,
  type TextCase,
  type TextSize,
} from './Text';
export {
  Surface,
  MATERIAL_ROLES,
  LIT_SLOTS,
  SURFACE_RADII,
  type SurfaceProps,
  type MaterialRole,
  type LitSlot,
  type SurfaceRadius,
} from './Surface';
export { Icon, ICON_SIZES, type IconProps, type IconSize } from './Icon';
export { focusRing, pressRing } from './Ring';
export { STEPS, stepVar, type Step } from './step';
