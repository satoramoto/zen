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
import type { HTMLAttributes } from 'svelte/elements';
import type { Facets, PackPrinciples } from './contract';
import type { ModeChoice } from './theme.model';
import ThemeScopeSvelte from './svelte/ThemeScope.svelte';
import TextSvelte from './primitives/Text.svelte';
import StackSvelte from './primitives/Stack.svelte';
import ButtonSvelte from './components/core/Button/Button.svelte';
import { actionOf } from './view/bridge';
import { bindDismiss } from './yahaha/AppBar/popover';
import { bindLineSlider } from './components/core/LineSlider/slide';
import { bindSegmented } from './components/core/Segmented/segmentedInput';
import SegmentedSvelte from './components/core/Segmented/Segmented.svelte';
import type { SegmentedModelProps } from './components/core/Segmented/Segmented.model';
import SelectSvelte from './components/core/Select/Select.svelte';
import type { SelectModelProps } from './components/core/Select/Select.model';
import { bindLongPress } from './components/core/Button/longPress';
import { bindKnob } from './components/music/Knob/knobInput';
import { bindPad } from './components/music/Pad/padPress';
import { bindFader } from './components/music/Fader/faderInput';
import { bindFit } from './components/music/ChordReadout/fit';
import { bindTempoNumber, bindTempoStep } from './components/music/TempoReadout/tempoGestures';
import { bindBarInput } from './components/music/BarReadout/barInput';
import type { TextModelProps } from './primitives/Text.model';
import type { StackModelProps } from './primitives/Stack.model';
import type { ButtonModelProps } from './components/core/Button/Button.model';
import OpaqueSvelte from './primitives/Opaque.svelte';
import HoleSvelte from './primitives/Hole.svelte';
import RegionSvelte from './layout/Region.svelte';
import GroupSvelte from './layout/Group.svelte';
import LayerSvelte from './layout/Layer.svelte';
import ScreenSvelte from './layout/Screen.svelte';
import AssembledScreenSvelte from './layout/assembly/AssembledScreen.svelte';
import type { AmbientRegion } from './contract';
import type { RegionModelProps } from './layout/Region.model';
import type { TabItemModel, TipAction } from './layout/Tabs.model';
import type { GroupModelProps } from './layout/Group.model';
import type { LayerModelProps } from './layout/Layer.model';
import type { ScreenModelProps } from './layout/Screen.model';
import type { Placed, Placement, Principles, ScreenSpec } from './layout/assembly/types';
import PadSvelte from './components/music/Pad/Pad.svelte';
import KnobSvelte from './components/music/Knob/Knob.svelte';
import FaderSvelte from './components/music/Fader/Fader.svelte';
import KeysSvelte from './components/music/Keys/Keys.svelte';
import MeterSvelte from './components/music/Meter/Meter.svelte';
import BarBeatSvelte from './components/music/BarBeat/BarBeat.svelte';
import ChordReadoutSvelte from './components/music/ChordReadout/ChordReadout.svelte';
import PartMarksSvelte from './components/music/PartMarks/PartMarks.svelte';
import SectionNameSvelte from './components/music/SectionName/SectionName.svelte';
import TempoReadoutSvelte from './components/music/TempoReadout/TempoReadout.svelte';
import BarReadoutSvelte from './components/music/BarReadout/BarReadout.svelte';
import SendReadoutSvelte from './components/music/SendReadout/SendReadout.svelte';
import SoundCellSvelte from './components/music/SoundCell/SoundCell.svelte';
import RackCellSvelte from './components/music/RackCell/RackCell.svelte';
import type { PadModelProps } from './components/music/Pad/Pad.model';
import type { KnobModelProps } from './components/music/Knob/Knob.model';
import type { FaderModelProps } from './components/music/Fader/Fader.model';
import type { KeysModelProps } from './components/music/Keys/Keys.model';
import type { MeterModelProps } from './components/music/Meter/Meter.model';
import type { BarBeatModelProps } from './components/music/BarBeat/BarBeat.model';
import type { ChordReadoutModelProps } from './components/music/ChordReadout/ChordReadout.model';
import type { PartMarksModelProps } from './components/music/PartMarks/PartMarks.model';
import type { SectionNameModelProps } from './components/music/SectionName/SectionName.model';
import type { TempoReadoutModelProps } from './components/music/TempoReadout/TempoReadout.model';
import type { BarReadoutModelProps } from './components/music/BarReadout/BarReadout.model';
import type { SendReadoutModelProps } from './components/music/SendReadout/SendReadout.model';
import type { SoundCellModelProps } from './components/music/SoundCell/SoundCell.model';
import type { RackCellModelProps } from './components/music/RackCell/RackCell.model';
import SurfaceSvelte from './primitives/Surface.svelte';
import IconSvelte from './primitives/Icon.svelte';
import LampButtonSvelte from './components/core/LampButton/LampButton.svelte';
import LineSliderSvelte from './components/core/LineSlider/LineSlider.svelte';
import ToggleSvelte from './components/core/Toggle/Toggle.svelte';
import SwitchSvelte from './components/core/Toggle/Switch.svelte';
import DisclosureSvelte from './components/core/Disclosure/Disclosure.svelte';
import StepValueSvelte from './components/core/StepValue/StepValue.svelte';
import ReadoutSvelte from './components/core/Readout/Readout.svelte';
import type { StepValueModelProps } from './components/core/StepValue/StepValue.model';
import type { ReadoutModelProps } from './components/core/Readout/Readout.model';
import NumberFieldSvelte from './components/core/NumberField/NumberField.svelte';
import type { NumberFieldModelProps } from './components/core/NumberField/NumberField.model';
import CheckboxSvelte from './components/core/Checkbox/Checkbox.svelte';
import RadioSvelte from './components/core/Radio/Radio.svelte';
import type { CheckModelProps } from './components/core/Checkbox/Checkbox.model';
import StatusDotSvelte from './components/core/StatusDot/StatusDot.svelte';
import SeparatorSvelte from './components/core/Separator/Separator.svelte';
import SettingsRowSvelte from './components/core/SettingsRow/SettingsRow.svelte';
import TabsSvelte from './layout/Tabs.svelte';
import type { SurfaceModelProps } from './primitives/Surface.model';
import type { IconModelProps } from './primitives/Icon.model';
import type { LampButtonModelProps } from './components/core/LampButton/LampButton.model';
import type { LineSliderModelProps } from './components/core/LineSlider/LineSlider.model';
import type { SwitchModelProps, ToggleModelProps } from './components/core/Toggle/Toggle.model';
import type { DisclosureModelProps } from './components/core/Disclosure/Disclosure.model';
import type { StatusDotModelProps } from './components/core/StatusDot/StatusDot.model';
import type { SeparatorModelProps } from './components/core/Separator/Separator.model';
import type { SettingsRowModelProps } from './components/core/SettingsRow/SettingsRow.model';
import type { TabsModelProps } from './layout/Tabs.model';
import HealthSlotSvelte from './yahaha/HealthSlot/HealthSlot.svelte';
import MetronomePopoverSvelte from './yahaha/AppBar/MetronomePopover.svelte';
import AppBarSvelte from './yahaha/AppBar/AppBar.svelte';
import type { HealthSlotModelProps } from './yahaha/HealthSlot/HealthSlot.model';
import type { MetronomePopoverModelProps } from './yahaha/AppBar/MetronomePopover.model';
import type { AppBarModelProps } from './yahaha/AppBar/AppBar.model';
import AccentBlockSvelte from './yahaha/AccentBlock/AccentBlock.svelte';
import WaitingChipSvelte from './yahaha/WaitingChip/WaitingChip.svelte';
import StatusLineSvelte from './yahaha/StatusLine/StatusLine.svelte';
import DisplayArtSvelte from './yahaha/DisplayArt/DisplayArt.svelte';
import HueLegendSvelte from './yahaha/HueLegend/HueLegend.svelte';
import OneTouchPickerSvelte from './yahaha/OneTouchPicker/OneTouchPicker.svelte';
import type { AccentBlockModelProps } from './yahaha/AccentBlock/AccentBlock.model';
import type { WaitingChipModelProps } from './yahaha/WaitingChip/WaitingChip.model';
import type { StatusLineModelProps } from './yahaha/StatusLine/StatusLine.model';
import type { DisplayArtModelProps } from './yahaha/DisplayArt/DisplayArt.model';
import type { HueLegendProps } from './yahaha/HueLegend/HueLegend.model';
import type { OneTouchPickerProps } from './yahaha/OneTouchPicker/OneTouchPicker.model';
import DisplaySvelte from './yahaha/Display/Display.svelte';
import SongFormSvelte from './yahaha/SongForm/SongForm.svelte';
import FaderBankSvelte from './yahaha/FaderBank/FaderBank.svelte';
import FaderBankRegionSvelte from './yahaha/FaderBank/FaderBankRegion.svelte';
import KnobBankSvelte from './yahaha/KnobBank/KnobBank.svelte';
import KnobBankRegionSvelte from './yahaha/KnobBank/KnobBankRegion.svelte';
import PadBankSvelte from './yahaha/PadBank/PadBank.svelte';
import PadBankRegionSvelte from './yahaha/PadBank/PadBankRegion.svelte';
import StageSvelte from './yahaha/Stage/Stage.svelte';
import type { StageModelProps } from './yahaha/Stage/Stage.model';
import type { DisplayModelProps } from './yahaha/Display/Display.model';
import type { SongFormProps as SongFormModelProps } from './yahaha/SongForm/SongForm.model';
import type { FaderBankModelProps, FaderBankRegionModelProps } from './yahaha/FaderBank/FaderBank.model';
import type { KnobBankProps as KnobBankModelProps, KnobBankRegionModelProps } from './yahaha/KnobBank/KnobBank.model';
import type { PadBankProps as PadBankModelProps, PadBankRegionProps as PadBankRegionModelProps } from './yahaha/PadBank/PadBank.model';
import PageListSvelte from './components/core/PageList/PageList.svelte';
import SliderSvelte from './components/core/Slider/Slider.svelte';
import type { SliderModelProps } from './components/core/Slider/Slider.model';
import FolderListSvelte from './components/core/FolderList/FolderList.svelte';
import type { PageListModelProps } from './components/core/PageList/PageList.model';
import type { FolderListModelProps } from './components/core/FolderList/FolderList.model';

// The theme: the `theme` action, the scope, and the system mode.
export { theme, systemMode, getThemeScope, setThemeScope, type ThemeParams, type ThemeScopeValue } from './svelte/theme.svelte';
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
export { getForm, getChosenForm, setFormContext } from './layout/assembly/forms.svelte';
export { scopePrinciples } from './layout/assembly/principles.svelte';
export { measureRoom } from './layout/assembly/room.svelte';

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
/** Knob's input as an action, for an app's own knob (`use:knobInput={{ onstep }}`). */
export const knobInput = actionOf(bindKnob);
export interface FaderProps extends FaderModelProps {}
export const Fader = FaderSvelte as unknown as Component<FaderProps>;
/** Fader's drag, keys and wheel as an action, for an app's own fader (`use:faderInput={{ level, onlevel }}`). */
export const faderInput = actionOf(bindFader);
export type KeysProps = KeysModelProps;
export const Keys = KeysSvelte as unknown as Component<KeysProps>;
export interface MeterProps extends Omit<MeterModelProps, 'className'> {
  class?: string;
}
export const Meter = MeterSvelte as unknown as Component<MeterProps>;
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
  /** Accepted for React parity; the Svelte Surface draws no shader yet (its CSS layer only). */
  shader?: string | false;
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

export { focusRing, pressRing } from './primitives/Ring';

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
export { CONTROL_SIZES, type ControlSize } from './components/core/Toggle/sizes';

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
import ModalSvelte from './components/core/Modal/Modal.svelte';
import SheetSvelte from './components/core/Modal/Sheet.svelte';
import type { ModalModelProps, SheetModelProps } from './components/core/Modal/Modal.model';
export type { SheetSide } from './components/core/Modal/Modal.model';
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
import ActionButtonSvelte from './components/core/ActionButton/ActionButton.svelte';
import SearchFieldSvelte from './components/core/SearchField/SearchField.svelte';
import type { ActionButtonModelProps } from './components/core/ActionButton/ActionButton.model';
import type { SearchFieldModelProps } from './components/core/SearchField/SearchField.model';
export type { ActionTone } from './components/core/ActionButton/ActionButton.model';
export interface ActionButtonProps extends ActionButtonModelProps {
  children?: Snippet;
}
export const ActionButton = ActionButtonSvelte as unknown as Component<ActionButtonProps>;
export interface SearchFieldProps extends SearchFieldModelProps {
  ref?: HTMLInputElement | null;
}
export const SearchField = SearchFieldSvelte as unknown as Component<SearchFieldProps, {}, 'ref'>;

// Lane S1-B: Popover (the panel as a snippet; `createHoverIntent` for a hover-opened one).
import PopoverSvelte from './components/core/Popover/Popover.svelte';
import type { PopoverBindingProps } from './components/core/Popover/Popover.model';
export type { Dismissal, PopupBox, PopoverAnchor } from './components/core/Popover/placement';
export { createHoverIntent, type HoverIntentStore, type HoverIntentOptions, type HoverPanel } from './components/core/Popover/hoverIntent';
export interface PopoverProps extends PopoverBindingProps {
  children?: Snippet;
}
export const Popover = PopoverSvelte as unknown as Component<PopoverProps>;

export type StatusDotProps = StatusDotModelProps;
export const StatusDot = StatusDotSvelte as unknown as Component<StatusDotProps>;

export type SeparatorProps = SeparatorModelProps;
export const Separator = SeparatorSvelte as unknown as Component<SeparatorProps>;

export interface SettingsRowProps extends SettingsRowModelProps {
  children?: Snippet;
}
export const SettingsRow = SettingsRowSvelte as unknown as Component<SettingsRowProps>;

export type { TabItemModel as TabItem, TipAction as TabsTipAction } from './layout/Tabs.model';
export type TabsProps = TabsModelProps<string | Snippet>;
export const Tabs = TabsSvelte as unknown as Component<TabsProps>;
// Lane S1-B: Slider (the Param gesture and the typed readout are stores its tree binds).
export type { SliderLayout, SliderSide, SliderTyping } from './components/core/Slider/Slider.model';
export type SliderProps = SliderModelProps;
export const Slider = SliderSvelte as unknown as Component<SliderProps>;
// Lane S1-B: PageList and FolderList.
export type { PageItem } from './components/core/PageList/PageList.model';
export type PageListProps = PageListModelProps;
export const PageList = PageListSvelte as unknown as Component<PageListProps>;
export type { FolderItem } from './components/core/FolderList/FolderList.model';
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
export { createFocusReturn, type DismissParams } from './yahaha/AppBar/popover';

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
export type StageProps = StageModelProps<string | Snippet>;
export const Stage = StageSvelte as unknown as Component<StageProps>;
export { TEMPO_MAX, TEMPO_MIN, STAGE_SPECS, type StageFit, type StageLayout, type StageTipAction } from './yahaha/Stage/Stage.model';
export { tapTempo, createTapTempo, TAP_COUNT, TAP_RESET_MS, type TapTempo } from './yahaha/Stage/tapTempo';
export { sectionPads, pressSectionPad, SECTIONS_BANK, SECTION_PAD_LAYOUT, type SectionPadAction, type SectionPadHandlers } from './yahaha/Stage/sectionPads';
