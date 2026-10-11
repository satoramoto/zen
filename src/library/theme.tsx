import type { CSSProperties, ReactNode } from 'react';
import { toCssVars, type Facets } from './contract';
import { packs, type ThemePack } from './themes/packs';
import { palettes } from './themes/palettes';
import { types } from './themes/types';
import { chromes } from './themes/chromes';
import { densities } from './themes/densities';
import './library.css';

export const FROM_THEME = 'theme';

export interface ThemeChoice {
  theme?: string;
  palette?: string;
  type?: string;
  chrome?: string;
  density?: string;
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
      type: pick(types, choice.type, base.type),
      chrome: pick(chromes, choice.chrome, base.chrome),
      density: pick(densities, choice.density, base.density),
    },
  };
}

export function ThemeScope({ facets, children }: { facets: Facets; children: ReactNode }) {
  return (
    <div className="lib-scope" style={toCssVars(facets) as CSSProperties}>
      {children}
    </div>
  );
}
