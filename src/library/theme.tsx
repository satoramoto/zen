import { createContext, useContext, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { toCssVars, type Facets, type Mode, type PackPrinciples } from './contract';
import './library.css';
import './yahaha/tokens.css';

// Resolving a choice has no React in it; it lives in resolve.ts so framework-free code can use it.
export { FROM_THEME, resolveTheme, type ThemeChoice } from './resolve';

/** `system` follows the operating system's light/dark preference. */
export type ModeChoice = Mode | 'system';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const media = () => (typeof window === 'undefined' || !window.matchMedia ? null : window.matchMedia(DARK_QUERY));
function subscribe(onChange: () => void) {
  const list = media();
  list?.addEventListener('change', onChange);
  return () => list?.removeEventListener('change', onChange);
}
const systemMode = (): Mode => (media()?.matches ? 'dark' : 'light');

/** The operating system's light/dark preference, kept current. */
export function useSystemMode(): Mode {
  return useSyncExternalStore(subscribe, systemMode, () => 'dark');
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
  const system = useSystemMode();
  const resolved = mode === 'system' ? system : mode;
  return (
    <ScopeContext.Provider value={{ facets, principles }}>
      <div className="lib-scope" data-mode={resolved} data-bleed={bleed || undefined} style={toCssVars(facets, resolved) as CSSProperties}>
        {children}
      </div>
    </ScopeContext.Provider>
  );
}
