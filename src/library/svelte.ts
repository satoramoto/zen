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
