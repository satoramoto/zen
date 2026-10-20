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

// Controls.
export interface ButtonProps extends ButtonModelProps {
  icon?: Snippet;
}
export const Button = ButtonSvelte as unknown as Component<ButtonProps>;
export { longPress } from './components/core/Button/longPress.svelte';

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
