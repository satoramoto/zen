// The Svelte entry of @satoramoto/zen: `@satoramoto/zen/svelte`. Svelte 5 renderers of the same
// models the React components draw (`<Name>.model.ts`), with the same markup, classes and data
// attributes, so `@satoramoto/zen/zen.css` styles both. Tokens, themes and the shared prop types
// (`ButtonHue`, `TextRole`, …) come from `@satoramoto/zen` as before.
//
//   import { ThemeScope, Button, Stack, Text } from '@satoramoto/zen/svelte';
//   import '@satoramoto/zen/zen.css';
//
// Each component is exported as a typed `Component<Props>` (the `.svelte` file's own props, which
// the declaration build can't read). A lane adds its components here, one block each.
import type { Component, Snippet } from 'svelte';
// The mix[flow] toolkit as a namespace; the flat music names in this entry are the token-drawn parts.
export * as Music from './music/svelte';
/** The Ableton Push 3: its surface, display and device over a Set, with the device model (docs/push.md). */
export * as Push from './push/svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Facets, PackPrinciples } from './contract';
import type { ModeChoice } from './theme.model';
import ThemeScopeSvelte from './foundation/svelte/ThemeScope.svelte';
import TextSvelte from './primitives/Text/Text.svelte';
import StackSvelte from './primitives/Stack/Stack.svelte';
import ButtonSvelte from './components/Button/Button.svelte';
import { actionOf } from './foundation/view/bridge';
import { bindDismiss } from './yahaha/components/AppBar/popover';
import { bindLineSlider } from './components/LineSlider/slide';
import { bindSegmented } from './components/Segmented/segmentedInput';
import SegmentedSvelte from './components/Segmented/Segmented.svelte';
import type { SegmentedModelProps } from './components/Segmented/Segmented.model';
import SelectSvelte from './components/Select/Select.svelte';
import type { SelectModelProps } from './components/Select/Select.model';
import { bindLongPress } from './components/Button/longPress';
import { bindKnob } from './music/components/KnobReadout/knobInput';
import { bindPad } from './music/components/Pad/padPress';
import { bindFader } from './music/components/Fader/faderInput';
import { bindFit } from './music/components/ChordReadout/fit';
import { bindTempoNumber, bindTempoStep } from './music/components/TempoReadout/tempoGestures';
import { bindBarInput } from './music/components/BarReadout/barInput';
import type { TextModelProps } from './primitives/Text/Text.model';
import type { StackModelProps } from './primitives/Stack/Stack.model';
import type { ButtonModelProps } from './components/Button/Button.model';
import OpaqueSvelte from './primitives/Opaque/Opaque.svelte';
import HoleSvelte from './primitives/Hole/Hole.svelte';
import RegionSvelte from './layouts/Region/Region.svelte';
import GroupSvelte from './layouts/Group/Group.svelte';
import LayerSvelte from './layouts/Layer/Layer.svelte';
import ScreenSvelte from './layouts/Screen/Screen.svelte';
import AssembledScreenSvelte from './layouts/Assembly/AssembledScreen.svelte';
import WorkspaceSvelte from './layouts/Workspace/Workspace.svelte';
import type { WorkspaceModelProps } from './layouts/Workspace/Workspace.model';
import type { SurfaceRegion } from './layouts/Workspace/Workspace.types';
import type { AmbientRegion } from './contract';
import type { RegionModelProps } from './layouts/Region/Region.model';
import type { TabItemModel } from './layouts/Tabs/Tabs.model';
import type { TipAction } from './foundation/view/tip';
import type { SurfaceShader } from './primitives/surfaceShader';
import type { GroupModelProps } from './layouts/Group/Group.model';
import type { LayerModelProps } from './layouts/Layer/Layer.model';
import type { ScreenModelProps } from './layouts/Screen/Screen.model';
import type { Placed, Placement, Principles, ScreenSpec } from './layouts/Assembly/types';
import PadSvelte from './music/components/Pad/Pad.svelte';
import KnobSvelte from './music/components/KnobReadout/KnobReadout.svelte';
import FaderSvelte from './music/components/Fader/Fader.svelte';
import KeysSvelte from './music/components/Keys/Keys.svelte';
import BarBeatSvelte from './music/components/BarBeat/BarBeat.svelte';
import ChordReadoutSvelte from './music/components/ChordReadout/ChordReadout.svelte';
import PartMarksSvelte from './music/components/PartMarks/PartMarks.svelte';
import SectionNameSvelte from './music/components/SectionName/SectionName.svelte';
import TempoReadoutSvelte from './music/components/TempoReadout/TempoReadout.svelte';
import BarReadoutSvelte from './music/components/BarReadout/BarReadout.svelte';
import SendReadoutSvelte from './music/components/SendReadout/SendReadout.svelte';
import SoundCellSvelte from './music/components/SoundCell/SoundCell.svelte';
import RackCellSvelte from './music/components/RackCell/RackCell.svelte';
import type { PadModelProps } from './music/components/Pad/Pad.model';
import type { KnobReadoutModelProps as KnobModelProps } from './music/components/KnobReadout/KnobReadout.model';
import type { FaderModelProps } from './music/components/Fader/Fader.model';
import type { KeysModelProps } from './music/components/Keys/Keys.model';
import type { BarBeatModelProps } from './music/components/BarBeat/BarBeat.model';
import type { ChordReadoutModelProps } from './music/components/ChordReadout/ChordReadout.model';
import type { PartMarksModelProps } from './music/components/PartMarks/PartMarks.model';
import type { SectionNameModelProps } from './music/components/SectionName/SectionName.model';
import type { TempoReadoutModelProps } from './music/components/TempoReadout/TempoReadout.model';
import type { BarReadoutModelProps } from './music/components/BarReadout/BarReadout.model';
import type { SendReadoutModelProps } from './music/components/SendReadout/SendReadout.model';
import type { SoundCellModelProps } from './music/components/SoundCell/SoundCell.model';
import type { RackCellModelProps } from './music/components/RackCell/RackCell.model';
import SurfaceSvelte from './primitives/Surface/Surface.svelte';
import IconSvelte from './primitives/Icon/Icon.svelte';
import LampButtonSvelte from './components/LampButton/LampButton.svelte';
import LineSliderSvelte from './components/LineSlider/LineSlider.svelte';
import ToggleSvelte from './components/Toggle/Toggle.svelte';
import SwitchSvelte from './components/Toggle/Switch.svelte';
import DisclosureSvelte from './components/Disclosure/Disclosure.svelte';
import StepValueSvelte from './components/StepValue/StepValue.svelte';
import ReadoutSvelte from './components/Readout/Readout.svelte';
import type { StepValueModelProps } from './components/StepValue/StepValue.model';
import type { ReadoutModelProps } from './components/Readout/Readout.model';
import NumberFieldSvelte from './components/NumberField/NumberField.svelte';
import type { NumberFieldModelProps } from './components/NumberField/NumberField.model';
import CheckboxSvelte from './components/Checkbox/Checkbox.svelte';
import RadioSvelte from './components/Radio/Radio.svelte';
import type { CheckModelProps } from './components/Checkbox/Checkbox.model';
import StatusDotSvelte from './components/StatusDot/StatusDot.svelte';
import SeparatorSvelte from './components/Separator/Separator.svelte';
import CodeImageSvelte from './components/CodeImage/CodeImage.svelte';
import SettingsRowSvelte from './components/SettingsRow/SettingsRow.svelte';
import TabsSvelte from './layouts/Tabs/Tabs.svelte';
import type { SurfaceModelProps } from './primitives/Surface/Surface.model';
import type { IconModelProps } from './primitives/Icon/Icon.model';
import type { LampButtonModelProps } from './components/LampButton/LampButton.model';
import type { LineSliderModelProps } from './components/LineSlider/LineSlider.model';
import type { SwitchModelProps, ToggleModelProps } from './components/Toggle/Toggle.model';
import type { DisclosureModelProps } from './components/Disclosure/Disclosure.model';
import type { StatusDotModelProps } from './components/StatusDot/StatusDot.model';
import type { SeparatorModelProps } from './components/Separator/Separator.model';
import type { CodeImageModelProps } from './components/CodeImage/CodeImage.model';
import type { SettingsRowModelProps } from './components/SettingsRow/SettingsRow.model';
import type { TabsModelProps } from './layouts/Tabs/Tabs.model';
import HealthSlotSvelte from './yahaha/components/HealthSlot/HealthSlot.svelte';
import MetronomePopoverSvelte from './yahaha/components/AppBar/MetronomePopover.svelte';
import AppBarSvelte from './yahaha/components/AppBar/AppBar.svelte';
import type { HealthSlotModelProps } from './yahaha/components/HealthSlot/HealthSlot.model';
import type { MetronomePopoverModelProps } from './yahaha/components/AppBar/MetronomePopover.model';
import type { AppBarModelProps } from './yahaha/components/AppBar/AppBar.model';
import AccentBlockSvelte from './yahaha/components/AccentBlock/AccentBlock.svelte';
import WaitingChipSvelte from './yahaha/components/WaitingChip/WaitingChip.svelte';
import StatusLineSvelte from './yahaha/components/StatusLine/StatusLine.svelte';
import DisplayArtSvelte from './yahaha/components/DisplayArt/DisplayArt.svelte';
import HueLegendSvelte from './yahaha/components/HueLegend/HueLegend.svelte';
import OneTouchPickerSvelte from './yahaha/components/OneTouchPicker/OneTouchPicker.svelte';
import type { AccentBlockModelProps } from './yahaha/components/AccentBlock/AccentBlock.model';
import type { WaitingChipModelProps } from './yahaha/components/WaitingChip/WaitingChip.model';
import type { StatusLineModelProps } from './yahaha/components/StatusLine/StatusLine.model';
import type { DisplayArtModelProps } from './yahaha/components/DisplayArt/DisplayArt.model';
import type { HueLegendProps } from './yahaha/components/HueLegend/HueLegend.model';
import type { OneTouchPickerProps } from './yahaha/components/OneTouchPicker/OneTouchPicker.model';
import DisplaySvelte from './yahaha/components/Display/Display.svelte';
import SongFormSvelte from './yahaha/components/SongForm/SongForm.svelte';
import FaderBankSvelte from './yahaha/components/FaderBank/FaderBank.svelte';
import FaderBankRegionSvelte from './yahaha/components/FaderBank/FaderBankRegion.svelte';
import KnobBankSvelte from './yahaha/components/KnobBank/KnobBank.svelte';
import KnobBankRegionSvelte from './yahaha/components/KnobBank/KnobBankRegion.svelte';
import PadBankSvelte from './yahaha/components/PadBank/PadBank.svelte';
import PadBankRegionSvelte from './yahaha/components/PadBank/PadBankRegion.svelte';
import StageSvelte from './yahaha/screens/Stage/Stage.svelte';
import type { StageModelProps } from './yahaha/screens/Stage/Stage.model';
import type { DisplayModelProps } from './yahaha/components/Display/Display.model';
import type { SongFormProps as SongFormModelProps } from './yahaha/components/SongForm/SongForm.model';
import type { FaderBankModelProps, FaderBankRegionModelProps } from './yahaha/components/FaderBank/FaderBank.model';
import type { KnobBankProps as KnobBankModelProps, KnobBankRegionModelProps } from './yahaha/components/KnobBank/KnobBank.model';
import type { PadBankProps as PadBankModelProps, PadBankRegionProps as PadBankRegionModelProps } from './yahaha/components/PadBank/PadBank.model';
import PageListSvelte from './components/PageList/PageList.svelte';
import SliderSvelte from './components/Slider/Slider.svelte';
import type { SliderModelProps } from './components/Slider/Slider.model';
import FolderListSvelte from './components/FolderList/FolderList.svelte';
import type { PageListModelProps } from './components/PageList/PageList.model';
import type { FolderListModelProps } from './components/FolderList/FolderList.model';

// The theme: the `theme` action, the scope, and the system mode.
export { theme, systemMode, getThemeScope, setThemeScope, type ThemeParams, type ThemeScopeValue } from './foundation/svelte/theme.svelte';
export interface ThemeScopeProps {
  facets: Facets;
  principles?: PackPrinciples;
  mode?: ModeChoice;
  bleed?: boolean;
  children?: Snippet;
}
export const ThemeScope = ThemeScopeSvelte as unknown as Component<ThemeScopeProps>;

// Primitives.
export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'role'>, Omit<TextModelProps, 'className'> {
  as?: string;
  class?: string;
  ref?: HTMLElement | null;
  children?: Snippet;
}
export const Text = TextSvelte as unknown as Component<TextProps, {}, 'ref'>;

export interface StackProps extends HTMLAttributes<HTMLElement>, Omit<StackModelProps, 'className'> {
  as?: string;
  class?: string;
  children?: Snippet;
}
export const Stack = StackSvelte as unknown as Component<StackProps>;

// Opaque and Hole (Surface itself is exported with the primitives).
export const Opaque = OpaqueSvelte as unknown as Component<{ class?: string; style?: string; children?: Snippet }>;
export const Hole = HoleSvelte as unknown as Component<{ class?: string; style?: string; name?: string; children?: Snippet }>;
export { setControlContext, getControlContext, CONTROL_FIELD, CONTROL_TOOLBAR, type ControlContextValue } from './primitives/control.svelte';

// Layout: regions, groups, layers and screens; the assembled screen and its form, room and principles runes.
export interface RegionProps extends Omit<RegionModelProps, 'className'> {
  label?: string | Snippet;
  aside?: string | Snippet;
  /** The views: the header shows a tab per view and the body the chosen one. */
  views?: TabItemModel<string | Snippet>[];
  /** The chosen view's id (controlled, bindable). */
  view?: string;
  defaultView?: string;
  onView?: (id: string) => void;
  tipAction?: TipAction;
  class?: string;
  style?: string;
  /** The body; with views, called with the chosen view's id. */
  children?: Snippet<[string | undefined]>;
}
export const Region = RegionSvelte as unknown as Component<RegionProps>;
export interface GroupProps extends Omit<GroupModelProps, 'className'> {
  label?: string | Snippet | false;
  aside?: string | Snippet;
  class?: string;
  style?: string;
  children?: Snippet;
}
export const Group = GroupSvelte as unknown as Component<GroupProps>;
export interface LayerProps extends HTMLAttributes<HTMLElement>, Omit<LayerModelProps, 'className'> {
  ambient?: AmbientRegion;
  as?: string;
  class?: string;
  children?: Snippet;
}
export const Layer = LayerSvelte as unknown as Component<LayerProps>;
export interface ScreenProps extends Omit<ScreenModelProps, 'className'> {
  header?: string | Snippet;
  footer?: string | Snippet;
  gridRef?: HTMLElement | null;
  gridStyle?: string;
  class?: string;
  style?: string;
  children?: Snippet;
  regions?: Record<string, Snippet<[string, Placed]>>;
  onPlacement?: (placement: Placement) => void;
}
export const Screen = ScreenSvelte as unknown as Component<ScreenProps, {}, 'gridRef'>;
export interface AssembledScreenProps {
  name: string;
  spec: ScreenSpec;
  regions?: Record<string, Snippet<[string, Placed]>>;
  room?: { w: number; h: number };
  principles?: Principles;
  onPlacement?: (placement: Placement) => void;
  class?: string;
  style?: string;
}
export const AssembledScreen = AssembledScreenSvelte as unknown as Component<AssembledScreenProps>;
/** The surface an app composes its DAW on (see the React `Workspace`): `pane` is a snippet of the instance and its target. */
export interface WorkspaceProps extends Omit<WorkspaceModelProps, 'className'> {
  class?: string;
  pane?: Snippet<[SurfaceRegion, string | undefined]>;
}
export const Workspace = WorkspaceSvelte as unknown as Component<WorkspaceProps>;
export * from './layouts/Workspace/Workspace.types';
export * from './layouts/Workspace/surface';
export * from './layouts/Workspace/surfaceMode';
export { getSurfaceMode } from './layouts/Workspace/surfaceMode.svelte';
export { contentSlot, surfaceUi, workspaceContent, type WorkspaceModelProps } from './layouts/Workspace/Workspace.model';
export { getForm, getChosenForm, setFormContext } from './layouts/Assembly/forms.svelte';
export { scopePrinciples } from './layouts/Assembly/principles.svelte';
export { measureRoom } from './layouts/Assembly/room.svelte';

// Controls.
export interface ButtonProps extends ButtonModelProps {
  icon?: Snippet;
}
export const Button = ButtonSvelte as unknown as Component<ButtonProps>;
/** Button's long press as an action, for an app's own elements (`use:longPress={{ onLongPress }}`). */
export const longPress = actionOf(bindLongPress);

// Music controls.
export interface PadProps extends PadModelProps {}
export const Pad = PadSvelte as unknown as Component<PadProps>;
/** Pad's press and tooltip as an action, for an app's own pad (`use:padPress={{ onPress }}`). */
export const padPress = actionOf(bindPad);
export interface KnobProps extends KnobModelProps {}
export const Knob = KnobSvelte as unknown as Component<KnobProps>;
/** The older value knob under its own name; `Knob` stays as its alias. */
export const KnobReadout = Knob;
export type KnobReadoutProps = KnobProps;
/** Knob's input as an action, for an app's own knob (`use:knobInput={{ onstep }}`). */
export const knobInput = actionOf(bindKnob);
export interface FaderProps extends FaderModelProps {}
export const Fader = FaderSvelte as unknown as Component<FaderProps>;
/** Fader's drag, keys and wheel as an action, for an app's own fader (`use:faderInput={{ level, onlevel }}`). */
export const faderInput = actionOf(bindFader);
export type KeysProps = KeysModelProps;
export const Keys = KeysSvelte as unknown as Component<KeysProps>;
/** The token-drawn level meter under its own name; `Meter` stays as its alias. */
export interface BarBeatProps extends BarBeatModelProps {}
export const BarBeat = BarBeatSvelte as unknown as Component<BarBeatProps>;
export interface ChordReadoutProps extends ChordReadoutModelProps {}
export const ChordReadout = ChordReadoutSvelte as unknown as Component<ChordReadoutProps>;
/** ChordReadout's fit as an action (`use:chordFit={{ onFit, key }}`): every update measures again. */
export const chordFit = actionOf(bindFit);
export interface PartMarksProps extends PartMarksModelProps {}
export const PartMarks = PartMarksSvelte as unknown as Component<PartMarksProps>;
export interface SectionNameProps extends SectionNameModelProps {}
export const SectionName = SectionNameSvelte as unknown as Component<SectionNameProps>;
export type TempoReadoutProps = TempoReadoutModelProps;
export const TempoReadout = TempoReadoutSvelte as unknown as Component<TempoReadoutProps>;
/** TempoReadout's number gestures (drag, wheel, keys, double-click reset) as an action. */
export const tempoNumber = actionOf(bindTempoNumber);
/** TempoReadout's + / − hold reporting as an action. */
export const tempoStep = actionOf(bindTempoStep);
export interface BarReadoutProps extends BarReadoutModelProps {}
export const BarReadout = BarReadoutSvelte as unknown as Component<BarReadoutProps>;
/** BarReadout's drag, keys, hold and reset as an action (`use:barInput={{ value, min, max, reset, onChange, onState }}`). */
export const barInput = actionOf(bindBarInput);
export interface SendReadoutProps extends SendReadoutModelProps {}
export const SendReadout = SendReadoutSvelte as unknown as Component<SendReadoutProps>;
export interface SoundCellProps extends SoundCellModelProps {
  marks?: Snippet;
}
export const SoundCell = SoundCellSvelte as unknown as Component<SoundCellProps>;
export interface RackCellProps extends RackCellModelProps {
  mark?: Snippet;
}
export const RackCell = RackCellSvelte as unknown as Component<RackCellProps>;
// Lane A: primitives and core controls.
export interface SurfaceProps extends HTMLAttributes<HTMLElement>, Omit<SurfaceModelProps, 'className'> {
  /** A shader material drawn under its content (a name, a compiled source, or `false`); default the
   *  scope's pack's `materials.shaders[layer]`. As React's Surface. */
  shader?: SurfaceShader;
  as?: string;
  class?: string;
  ref?: HTMLElement | null;
  children?: Snippet;
}
export const Surface = SurfaceSvelte as unknown as Component<SurfaceProps, {}, 'ref'>;

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>, Omit<IconModelProps, 'className'> {
  class?: string;
  children?: Snippet;
}
export const Icon = IconSvelte as unknown as Component<IconProps>;

export { focusRing, pressRing } from './primitives/Ring/Ring';

export type LampButtonProps = LampButtonModelProps;
export const LampButton = LampButtonSvelte as unknown as Component<LampButtonProps>;

export type LineSliderProps = LineSliderModelProps;
export const LineSlider = LineSliderSvelte as unknown as Component<LineSliderProps>;
export const lineSlider = actionOf(bindLineSlider);

export type SegmentedProps = SegmentedModelProps;
export const Segmented = SegmentedSvelte as unknown as Component<SegmentedProps>;
export const segmented = actionOf(bindSegmented);

export type SelectProps = SelectModelProps;
export const Select = SelectSvelte as unknown as Component<SelectProps>;

export interface ToggleProps extends ToggleModelProps {
  /** The face (stacked) or the reading (inside). */
  children?: Snippet;
}
export const Toggle = ToggleSvelte as unknown as Component<ToggleProps>;
export interface SwitchProps extends SwitchModelProps {
  /** A name beside it: the switch at the end of a line that labels it. */
  children?: Snippet;
}
export const Switch = SwitchSvelte as unknown as Component<SwitchProps>;
export type DisclosureProps = DisclosureModelProps;
export const Disclosure = DisclosureSvelte as unknown as Component<DisclosureProps>;
export { CONTROL_SIZES, type ControlSize } from './components/Toggle/sizes';

export type StepValueProps = StepValueModelProps;
export const StepValue = StepValueSvelte as unknown as Component<StepValueProps>;

export type ReadoutProps = ReadoutModelProps;
export const Readout = ReadoutSvelte as unknown as Component<ReadoutProps>;

export type NumberFieldProps = NumberFieldModelProps;
export const NumberField = NumberFieldSvelte as unknown as Component<NumberFieldProps>;

export interface CheckboxProps extends CheckModelProps {
  /** The label beside the box; without one, give `aria-label`. */
  children?: Snippet;
}
export const Checkbox = CheckboxSvelte as unknown as Component<CheckboxProps>;
export type RadioProps = CheckboxProps;
export const Radio = RadioSvelte as unknown as Component<RadioProps>;

// Lane S1-B: Modal and its Sheet form (body and actions as snippets).
import ModalSvelte from './components/Modal/Modal.svelte';
import SheetSvelte from './components/Modal/Sheet.svelte';
import type { ModalModelProps, SheetModelProps } from './components/Modal/Modal.model';
export type { SheetSide } from './components/Modal/Modal.model';
export interface ModalProps extends ModalModelProps {
  actions?: Snippet;
  children?: Snippet;
}
export const Modal = ModalSvelte as unknown as Component<ModalProps>;
export interface SheetProps extends SheetModelProps {
  actions?: Snippet;
  children?: Snippet;
}
export const Sheet = SheetSvelte as unknown as Component<SheetProps>;

// Lane S1-B: ActionButton (its face's content as a snippet) and SearchField (`bind:ref` is the input).
import ActionButtonSvelte from './components/ActionButton/ActionButton.svelte';
import SearchFieldSvelte from './components/SearchField/SearchField.svelte';
import type { ActionButtonModelProps } from './components/ActionButton/ActionButton.model';
import type { SearchFieldModelProps } from './components/SearchField/SearchField.model';
export type { ActionTone } from './components/ActionButton/ActionButton.model';
export interface ActionButtonProps extends ActionButtonModelProps {
  children?: Snippet;
}
export const ActionButton = ActionButtonSvelte as unknown as Component<ActionButtonProps>;
export interface SearchFieldProps extends SearchFieldModelProps {
  ref?: HTMLInputElement | null;
}
export const SearchField = SearchFieldSvelte as unknown as Component<SearchFieldProps, {}, 'ref'>;

// Gate: one shared key before an app shows anything (title, message and extra content as snippets).
import GateSvelte from './components/Gate/Gate.svelte';
import type { GateModelProps } from './components/Gate/Gate.model';
export interface GateProps extends GateModelProps {
  title?: Snippet;
  message?: Snippet;
  children?: Snippet;
}
export const Gate = GateSvelte as unknown as Component<GateProps>;

// VoteControl: a vote among a few choices with their meanings, and the tally.
import VoteControlSvelte from './components/VoteControl/VoteControl.svelte';
import type { VoteControlModelProps } from './components/VoteControl/VoteControl.model';
export type { VoteChoice, Voter } from './components/VoteControl/VoteControl.model';
export type VoteControlProps = VoteControlModelProps;
export const VoteControl = VoteControlSvelte as unknown as Component<VoteControlProps>;

// NamePicker: pick your own name from a list, once (title, message and extra content as snippets).
import NamePickerSvelte from './components/NamePicker/NamePicker.svelte';
import type { NamePickerModelProps } from './components/NamePicker/NamePicker.model';
export interface NamePickerProps extends NamePickerModelProps {
  title?: Snippet;
  message?: Snippet;
  children?: Snippet;
}
export const NamePicker = NamePickerSvelte as unknown as Component<NamePickerProps>;

// Lane S1-B: Popover (the panel as a snippet; `createHoverIntent` for a hover-opened one).
import PopoverSvelte from './components/Popover/Popover.svelte';
import type { PopoverBindingProps } from './components/Popover/Popover.model';
export type { Dismissal, PopupBox, PopoverAnchor } from './components/Popover/placement';
export { createHoverIntent, type HoverIntentStore, type HoverIntentOptions, type HoverPanel } from './components/Popover/hoverIntent';
export interface PopoverProps extends PopoverBindingProps {
  children?: Snippet;
}
export const Popover = PopoverSvelte as unknown as Component<PopoverProps>;

export type StatusDotProps = StatusDotModelProps;
export const StatusDot = StatusDotSvelte as unknown as Component<StatusDotProps>;

export type SeparatorProps = SeparatorModelProps;
export const Separator = SeparatorSvelte as unknown as Component<SeparatorProps>;

/** A text as a code a phone can scan (a QR code), dark on light in every pack. */
export type CodeImageProps = CodeImageModelProps;
export const CodeImage = CodeImageSvelte as unknown as Component<CodeImageProps>;
export { encodeCode, CODE_IMAGE_MAX_BYTES } from './components/CodeImage/CodeImage.model';

export interface SettingsRowProps extends SettingsRowModelProps {
  children?: Snippet;
}
export const SettingsRow = SettingsRowSvelte as unknown as Component<SettingsRowProps>;

export type { TabItemModel as TabItem, TipAction as TabsTipAction } from './layouts/Tabs/Tabs.model';
export type TabsProps = TabsModelProps<string | Snippet>;
export const Tabs = TabsSvelte as unknown as Component<TabsProps>;
// Lane S1-B: Slider (the Param gesture and the typed readout are stores its tree binds).
export type { SliderLayout, SliderSide, SliderTyping } from './components/Slider/Slider.model';
export type SliderProps = SliderModelProps;
export const Slider = SliderSvelte as unknown as Component<SliderProps>;
// Lane S1-B: PageList and FolderList.
export type { PageItem } from './components/PageList/PageList.model';
export type PageListProps = PageListModelProps;
export const PageList = PageListSvelte as unknown as Component<PageListProps>;
export type { FolderItem } from './components/FolderList/FolderList.model';
export type FolderListProps = FolderListModelProps;
export const FolderList = FolderListSvelte as unknown as Component<FolderListProps>;
// Lane D2: Yahaha's AppBar, MetronomePopover and HealthSlot.
export type HealthSlotProps = HealthSlotModelProps;
export const HealthSlot = HealthSlotSvelte as unknown as Component<HealthSlotProps>;
export type MetronomePopoverProps = MetronomePopoverModelProps;
export const MetronomePopover = MetronomePopoverSvelte as unknown as Component<MetronomePopoverProps>;
export interface AppBarProps extends AppBarModelProps<string | Snippet> {
  end?: Snippet;
}
export const AppBar = AppBarSvelte as unknown as Component<AppBarProps>;
export const dismiss = actionOf(bindDismiss);
export { createFocusReturn, type DismissParams } from './yahaha/components/AppBar/popover';

// Yahaha widgets: Yahaha's own concepts, mapped onto the library's slots through `yahaha/hues.ts`.
export type AccentBlockProps = AccentBlockModelProps;
export const AccentBlock = AccentBlockSvelte as unknown as Component<AccentBlockProps>;
export type WaitingChipProps = WaitingChipModelProps;
export const WaitingChip = WaitingChipSvelte as unknown as Component<WaitingChipProps>;
export type StatusLineProps = StatusLineModelProps;
export const StatusLine = StatusLineSvelte as unknown as Component<StatusLineProps>;
export type DisplayArtProps = DisplayArtModelProps;
export const DisplayArt = DisplayArtSvelte as unknown as Component<DisplayArtProps>;
export type { HueLegendProps };
export const HueLegend = HueLegendSvelte as unknown as Component<HueLegendProps>;
export type { OneTouchPickerProps };
export const OneTouchPicker = OneTouchPickerSvelte as unknown as Component<OneTouchPickerProps>;

// Yahaha regions: each bank and its screen region (the Region with the bank's views).
export interface DisplayProps extends DisplayModelProps {}
export const Display = DisplaySvelte as unknown as Component<DisplayProps>;
export interface SongFormProps extends SongFormModelProps {}
export const SongForm = SongFormSvelte as unknown as Component<SongFormProps>;
export type FaderBankProps = FaderBankModelProps<string | Snippet>;
export const FaderBank = FaderBankSvelte as unknown as Component<FaderBankProps>;
export interface FaderBankRegionProps extends FaderBankRegionModelProps<string | Snippet> {
  class?: string;
}
export const FaderBankRegion = FaderBankRegionSvelte as unknown as Component<FaderBankRegionProps>;
export interface KnobBankProps extends KnobBankModelProps {}
export const KnobBank = KnobBankSvelte as unknown as Component<KnobBankProps>;
export interface KnobBankRegionProps extends KnobBankRegionModelProps {
  class?: string;
}
export const KnobBankRegion = KnobBankRegionSvelte as unknown as Component<KnobBankRegionProps>;
export interface PadBankProps extends PadBankModelProps {}
export const PadBank = PadBankSvelte as unknown as Component<PadBankProps>;
export interface PadBankRegionProps extends Omit<PadBankRegionModelProps, 'className'> {
  class?: string;
}
export const PadBankRegion = PadBankRegionSvelte as unknown as Component<PadBankRegionProps>;

// Yahaha's Stage: the whole app on one assembled screen, and its shared logic.
/** The Stage's props: the model's, and its two slots as snippets (`page`: a display page in the Display's place; `side`: a panel in the hero's right third). */
export type StageProps = StageModelProps<string | Snippet> & { page?: Snippet; side?: Snippet };
export const Stage = StageSvelte as unknown as Component<StageProps>;
export { TEMPO_MAX, TEMPO_MIN, STAGE_SPECS, STAGE_HERO_SPECS, type StageBackdrop, type StageFit, type StageHero, type StageLayout, type StageTipAction } from './yahaha/screens/Stage/Stage.model';
export { tapTempo, createTapTempo, TAP_COUNT, TAP_RESET_MS, type TapTempo } from './yahaha/screens/Stage/tapTempo';
export { sectionPads, pressSectionPad, SECTIONS_BANK, SECTION_PAD_LAYOUT, type SectionPadAction, type SectionPadHandlers } from './yahaha/screens/Stage/sectionPads';

// Mathematical presentation uses the same view trees as the React binding.
export { default as ExactValue } from "./math/components/ExactValue/ExactValue.svelte";
export { default as ExpressionField } from "./math/components/ExpressionField/ExpressionField.svelte";
export { default as PlotViewport } from "./math/components/PlotViewport/PlotViewport.svelte";
export type { ExactValueProps } from "./math/components/ExactValue/ExactValue.model";
export type { ExpressionFieldProps } from "./math/components/ExpressionField/ExpressionField.model";
export type { PlotViewportProps, PlotPoint, PlotCamera, PlotRegion } from "./math/components/PlotViewport/PlotViewport.model";
export { default as MathInspector } from "./math/components/MathInspector/MathInspector.svelte";
export type { MathInspectorProps, MathProperty, MathMembership } from "./math/components/MathInspector/MathInspector.model";
export { default as DistributionPlot } from './math/components/DistributionPlot/DistributionPlot.svelte';
export type { DistributionPlotProps, DistributionBin } from './math/components/DistributionPlot/DistributionPlot.model';
