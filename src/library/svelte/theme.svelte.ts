// The Svelte theme binding: the `theme` action, the system mode as a reactive value, and the scope
// context `ThemeScope.svelte` provides. Everything it decides comes from the framework-free themes
// entry (themes.ts, over theme.model.ts), which
// React's `ThemeScope` (theme.tsx) draws too: the same `.lib-scope` element, mode and variables.
import { getContext, setContext } from 'svelte';
import type { Action } from 'svelte/action';
import { createSubscriber } from 'svelte/reactivity';
import {
  getSystemMode,
  resolveMode,
  scopeView,
  subscribeSystemMode,
  type Facets,
  type Mode,
  type ModeChoice,
  type PackPrinciples,
} from '../themes';
import '../library.css';
import '../yahaha/tokens.css';

const followSystem = createSubscriber((update) => subscribeSystemMode(update));

/** The operating system's light/dark preference, kept current: `systemMode.current` is reactive
 *  in a component, a `$derived` or an `$effect` (the Svelte twin of React's `useSystemMode`). */
export const systemMode = {
  get current(): Mode {
    followSystem();
    return getSystemMode();
  },
};

export interface ThemeParams {
  facets: Facets;
  /** Default `system`: follows the operating system's preference. */
  mode?: ModeChoice;
  /** The scope is a whole screen (an app's window): it runs to the edges with no padding. */
  bleed?: boolean;
}

/**
 * Makes `node` a theme scope, as React's `ThemeScope` draws its element: the `lib-scope` class,
 * `data-mode` (resolved, following the system while the mode is `system`), `data-bleed`, and
 * `toCssVars()` as custom properties. `<div use:theme={{ facets, mode }}>`.
 */
export const theme: Action<HTMLElement, ThemeParams> = (node, initial) => {
  let params = initial;
  let applied: string[] = [];
  const apply = () => {
    const view = scopeView(params.facets, resolveMode(params.mode ?? 'system', getSystemMode()), params.bleed);
    node.classList.add(view.className);
    for (const [name, value] of Object.entries(view.attrs)) {
      if (value === undefined) node.removeAttribute(name);
      else node.setAttribute(name, value);
    }
    for (const name of applied) if (!(name in view.vars)) node.style.removeProperty(name);
    for (const [name, value] of Object.entries(view.vars)) node.style.setProperty(name, value);
    applied = Object.keys(view.vars);
  };
  apply();
  const unsubscribe = subscribeSystemMode(() => {
    if ((params.mode ?? 'system') === 'system') apply();
  });
  return {
    update(next) {
      params = next;
      apply();
    },
    destroy: unsubscribe,
  };
};

/** The facets (and the pack's layout principles) of the nearest `ThemeScope`. */
export interface ThemeScopeValue {
  readonly facets: Facets;
  readonly principles?: PackPrinciples;
}

const SCOPE = Symbol('zen.themeScope');

/** Provides a scope to the components inside (`ThemeScope.svelte` calls it; pass getters to keep it current). */
export const setThemeScope = (scope: ThemeScopeValue): ThemeScopeValue => setContext(SCOPE, scope);

/** A scope as a `mount()` context, for Svelte mounted inside a React `ThemeScope` (Storybook's
 *  `withRenderer`): `mount(C, { target, props, context: themeScopeContext(scope) })`. */
export const themeScopeContext = (scope: ThemeScopeValue | null): Map<symbol, ThemeScopeValue> => new Map(scope ? [[SCOPE, scope]] : []);

/** The nearest `ThemeScope`'s facets and principles, or `null` outside one (React's `useThemeScope`). */
export const getThemeScope = (): ThemeScopeValue | null => getContext<ThemeScopeValue | undefined>(SCOPE) ?? null;
