// The React binding of the skin helpers: a scope that wears a skin, and a provider that keeps the
// current skin (in localStorage, guarded) for the picker and editor to change. Everything it
// computes comes from skin.ts and persist.ts, which have no React.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ThemeScope, type ModeChoice } from '../theme';
import { packs } from '../themes/packs';
import { resolveSkin, skinFromPack, type Skin } from './skin';
import { forgetSkin, loadSkin, saveSkin, type SkinStorage } from './persist';

/** A `ThemeScope` wearing a skin. */
export function SkinScope({ skin, mode = 'system', bleed = false, children }: { skin: Skin; mode?: ModeChoice; bleed?: boolean; children: ReactNode }) {
  const { pack, facets } = useMemo(() => resolveSkin(skin), [skin]);
  return (
    <ThemeScope facets={facets} principles={pack.principles} mode={mode} bleed={bleed}>
      {children}
    </ThemeScope>
  );
}

export interface SkinContextValue {
  /** The skin being worn. */
  skin: Skin;
  /** Wear another skin (kept under the provider's `storageKey`). */
  setSkin(skin: Skin): void;
  /** Back to the provider's default skin, forgetting the kept one. */
  resetSkin(): void;
  /** The provider's default skin. */
  defaultSkin: Skin;
  /** The light/dark choice the scope wears. */
  mode: ModeChoice;
  setMode(mode: ModeChoice): void;
}

const SkinContext = createContext<SkinContextValue | null>(null);

/** The nearest `SkinProvider`'s skin and its setters, or `null` outside one. */
export function useSkin(): SkinContextValue | null {
  return useContext(SkinContext);
}

export interface SkinProviderProps {
  /** Where the current skin is kept (`'myapp.skin'`); leave it out to keep nothing. */
  storageKey?: string;
  /** The skin before anyone picks one: a skin, or a pack id. Default: zen's first pack. */
  defaultSkin?: Skin | string;
  /** The starting light/dark choice. Default `system`. */
  defaultMode?: ModeChoice;
  /** The scope is a whole window, run to the edges. */
  bleed?: boolean;
  /** Storage other than `localStorage` (tests, an app's own settings store). */
  storage?: SkinStorage;
  children: ReactNode;
}

/**
 * Wraps an app (or a part of one) in the current skin and lets `ThemeSettings`, `ThemePicker` and
 * `ThemeEditor` change it. The skin is restored from `storageKey` on mount and kept there on every
 * change; storage that fails leaves the skin applied for this visit only.
 */
export function SkinProvider({ storageKey, defaultSkin, defaultMode = 'system', bleed = false, storage, children }: SkinProviderProps) {
  const fallback = useMemo(
    () => (typeof defaultSkin === 'string' ? skinFromPack(defaultSkin) : (defaultSkin ?? skinFromPack(packs[0]))),
    [defaultSkin],
  );
  const [skin, setSkinState] = useState<Skin>(() => (storageKey ? loadSkin(storageKey, storage) : null) ?? fallback);
  const [mode, setMode] = useState<ModeChoice>(defaultMode);
  const setSkin = useCallback(
    (next: Skin) => {
      setSkinState(next);
      if (storageKey) saveSkin(storageKey, next, storage);
    },
    [storageKey, storage],
  );
  const resetSkin = useCallback(() => {
    setSkinState(fallback);
    if (storageKey) forgetSkin(storageKey, storage);
  }, [fallback, storageKey, storage]);
  const value = useMemo(() => ({ skin, setSkin, resetSkin, defaultSkin: fallback, mode, setMode }), [skin, setSkin, resetSkin, fallback, mode]);
  return (
    <SkinContext.Provider value={value}>
      <SkinScope skin={skin} mode={mode} bleed={bleed}>
        {children}
      </SkinScope>
    </SkinContext.Provider>
  );
}
