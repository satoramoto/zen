import { createContext, useContext, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import type { Facets, Mode, PackPrinciples } from './contract';
import { getSystemMode, resolveMode, scopeView, subscribeSystemMode, type ModeChoice } from './theme.model';
import './library.css';
import './yahaha/tokens.css';

// Resolving a choice has no React in it; it lives in resolve.ts so framework-free code can use it.
export { FROM_THEME, resolveTheme, type ThemeChoice } from './resolve';
// The system mode store and the scope's view are framework-free too (the Svelte `theme` action draws the same view).
export { scopeView, resolveMode, type ModeChoice } from './theme.model';

/** The operating system's light/dark preference, kept current. */
export function useSystemMode(): Mode {
  return useSyncExternalStore(subscribeSystemMode, getSystemMode, () => 'dark');
}

/** The facets (and the pack's layout principles) of the nearest `ThemeScope`, for code that
 *  computes with them (the assembly solver). `null` outside any scope. */
const ScopeContext = createContext<{ facets: Facets; principles?: PackPrinciples } | null>(null);

/** The nearest `ThemeScope`'s facets and principles, or `null` outside one. */
export function useThemeScope(): { facets: Facets; principles?: PackPrinciples } | null {
  return useContext(ScopeContext);
}

/** `bleed`: the scope is a whole screen (an app's window), so it runs to the edges with no padding.
 *  `principles`: the pack's layout principles, for screens assembled inside it (`layout/assembly`). */
export function ThemeScope({
  facets,
  principles,
  mode = 'system',
  bleed = false,
  children,
}: {
  facets: Facets;
  principles?: PackPrinciples;
  mode?: ModeChoice;
  bleed?: boolean;
  children: ReactNode;
}) {
  const view = scopeView(facets, resolveMode(mode, useSystemMode()), bleed);
  return (
    <ScopeContext.Provider value={{ facets, principles }}>
      <div className={view.className} {...view.attrs} style={view.vars as CSSProperties}>
        {children}
      </div>
    </ScopeContext.Provider>
  );
}
