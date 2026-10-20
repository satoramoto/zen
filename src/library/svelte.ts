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
import StatusDotSvelte from './components/core/StatusDot/StatusDot.svelte';
import SeparatorSvelte from './components/core/Separator/Separator.svelte';
import SettingsRowSvelte from './components/core/SettingsRow/SettingsRow.svelte';
import TabsSvelte from './layout/Tabs.svelte';
import type { SurfaceModelProps } from './primitives/Surface.model';
import type { IconModelProps } from './primitives/Icon.model';
import type { LampButtonModelProps } from './components/core/LampButton/LampButton.model';
import type { LineSliderModelProps } from './components/core/LineSlider/LineSlider.model';
import type { StatusDotModelProps } from './components/core/StatusDot/StatusDot.model';
import type { SeparatorModelProps } from './components/core/Separator/Separator.model';
import type { SettingsRowModelProps } from './components/core/SettingsRow/SettingsRow.model';
import type { TabsModelProps } from './layout/Tabs.model';
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
  class?: string;
  style?: string;
  children?: Snippet;
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
export { longPress } from './components/core/Button/longPress.svelte';

// Music controls.
export interface PadProps extends PadModelProps {}
export const Pad = PadSvelte as unknown as Component<PadProps>;
export { padPress } from './components/music/Pad/padPress.svelte';
export interface KnobProps extends KnobModelProps {}
export const Knob = KnobSvelte as unknown as Component<KnobProps>;
export { knobInput } from './components/music/Knob/knobInput.svelte';
export interface FaderProps extends FaderModelProps {}
export const Fader = FaderSvelte as unknown as Component<FaderProps>;
export { faderInput } from './components/music/Fader/faderInput.svelte';
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
export { chordFit } from './components/music/ChordReadout/fit.svelte';
export interface PartMarksProps extends PartMarksModelProps {}
export const PartMarks = PartMarksSvelte as unknown as Component<PartMarksProps>;
export interface SectionNameProps extends SectionNameModelProps {}
export const SectionName = SectionNameSvelte as unknown as Component<SectionNameProps>;
export type TempoReadoutProps = TempoReadoutModelProps;
export const TempoReadout = TempoReadoutSvelte as unknown as Component<TempoReadoutProps>;
export { tempoNumber, tempoStep } from './components/music/TempoReadout/tempoGestures.svelte';
export interface BarReadoutProps extends BarReadoutModelProps {}
export const BarReadout = BarReadoutSvelte as unknown as Component<BarReadoutProps>;
export { barInput } from './components/music/BarReadout/barInput.svelte';
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
export { lineSlider } from './components/core/LineSlider/slide.svelte';

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
