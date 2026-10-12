import { createContext, useContext, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { toCssVars, type Facets, type Mode, type PackPrinciples } from './contract';
import { packs, type ThemePack } from './themes/packs';
import { palettes } from './themes/palettes';
import { faces } from './themes/faces';
import { scales } from './themes/scales';
import { materials } from './themes/materials';
import './library.css';
import './yahaha/tokens.css';

export const FROM_THEME = 'theme';

/** `system` follows the operating system's light/dark preference. */
export type ModeChoice = Mode | 'system';

export interface ThemeChoice {
  theme?: string;
  palette?: string;
  faces?: string;
  scale?: string;
  materials?: string;
}

function pick<T extends { id: string }>(list: T[], id: string | undefined, fallback: T): T {
  if (!id || id === FROM_THEME) return fallback;
  return list.find((item) => item.id === id) ?? fallback;
}

/** A theme pack, with any facet swapped for another one. */
export function resolveTheme(choice: ThemeChoice): { pack: ThemePack; facets: Facets } {
  const pack = packs.find((p) => p.id === choice.theme) ?? packs[0];
  const base = pack.facets;
  return {
    pack,
    facets: {
      palette: pick(palettes, choice.palette, base.palette),
      faces: pick(faces, choice.faces, base.faces),
      scale: pick(scales, choice.scale, base.scale),
      materials: pick(materials, choice.materials, base.materials),
    },
  };
}

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
