// Core components: controls any app builds with. Each reads only the contract's variables; a
// colour slot (`hue.ts`) names a hue or role, and the app decides what it means.
export type { HueSlot, RoleSlot } from './hue';
export type { TipAction } from './Button/Button';
export { Button, type ButtonProps, type ButtonGlyph, type ButtonHue, type ButtonSize, type ButtonVariant, type ButtonFace } from './Button/Button';
export { LampButton, type LampButtonProps, type LampHue, type LampFace } from './LampButton/LampButton';
export { Separator, type SeparatorProps } from './Separator/Separator';
export { SearchField, type SearchFieldProps } from './SearchField/SearchField';
export { StatusDot, type StatusDotProps, type StatusDotHue } from './StatusDot/StatusDot';
export { StepValue, type StepValueProps, type StepHue } from './StepValue/StepValue';
export { LineSlider, type LineSliderProps } from './LineSlider/LineSlider';
export { Readout, type ReadoutProps } from './Readout/Readout';
export { SettingsRow, type SettingsRowProps } from './SettingsRow/SettingsRow';
export { FolderList, type FolderListProps, type FolderItem } from './FolderList/FolderList';
export { PageList, type PageListProps, type PageItem } from './PageList/PageList';

// The controls an app's panels are built from (APIs mirroring @openflow/widgets and the macOS controls).
// Renamed: ActionButton's face is `ActionButtonFace`, since `ButtonFace` is Button's face type above.
export {
  ActionButton,
  ButtonFace as ActionButtonFace,
  type ActionButtonProps,
  type ButtonFaceProps as ActionButtonFaceProps,
  type ActionTone,
} from './ActionButton/ActionButton';
export { Select, useSelect, TYPING_WINDOW, type SelectProps, type UseSelectOptions } from './Select/Select';
export { Segmented, useSegmented, itemsOf, type SegmentedProps } from './Segmented/Segmented';
/** A chart axis's measure, picked from a menu on the axis itself, with its ends' words either side. */
export { AxisPicker, type AxisPickerProps } from './AxisPicker/AxisPicker';
export { Popover, Popup, usePopover, type PopoverProps, type PopupProps, type PopupAnchor, type PopupBox, type Dismissal } from './Popover/Popover';
export { Toggle, Switch, useToggle, CONTROL_SIZES, type ToggleProps, type SwitchProps, type ControlSize } from './Toggle/Toggle';
export { Checkbox, CheckMark, DashMark, type CheckboxProps, type CheckProps, type ToggleValue } from './Checkbox/Checkbox';
export { Radio, type RadioProps } from './Radio/Radio';
export { Disclosure, type DisclosureProps } from './Disclosure/Disclosure';
export { NumberField, type NumberFieldProps } from './NumberField/NumberField';
export { Slider, type SliderProps, type SliderLayout, type SliderSide } from './Slider/Slider';
export {
  enumParam,
  fractionOf,
  valueAt,
  quantize,
  stepSize,
  isSwitch,
  format as formatParam,
  noteName,
  useParamGesture,
  FINE_KEY,
  // A keyStep that steps through detents, and a drag's catch on them.
  stepDetent,
  snapToDetent,
  type ParamKey,
  type ParamKeyStep,
  type Param,
  type ParamKind,
  type UnitStyle,
  type FillOrigin,
  type ParamVars,
  type ParamAxis,
  type ParamAnchor,
  type ParamGestureOptions,
  type ParamGesture,
  type ParamSurfaceProps,
} from './Param';
export { Modal, Sheet, type ModalProps, type SheetProps, type SheetSide } from './Modal/Modal';

// The node graph (Graph, Port, Device, NodeSheet) and the Circuit model live in their own area,
// `src/library/graph/`, exported from the package root beside this.
