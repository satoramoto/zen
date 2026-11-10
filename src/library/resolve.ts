// Resolving a theme choice to facets, with no React: `theme.tsx` re-exports it beside `ThemeScope`,
// and framework-free code (the skin helpers in `theme-editor/skin.ts`, a future Vue or Svelte
// binding) imports it from here.
import type { Facets } from './contract';
import { packs, type ThemePack } from './foundation/themes/packs';
import { palettes } from './foundation/themes/palettes';
import { faces } from './foundation/themes/faces';
import { scales } from './foundation/themes/scales';
import { materials } from './foundation/themes/materials';

export const FROM_THEME = 'theme';

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
