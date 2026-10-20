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
