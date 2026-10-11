import type { Decorator } from '@storybook/react-vite';
import { FROM_THEME, ThemeScope, resolveTheme } from './theme';
import { packs } from './themes/packs';
import { palettes } from './themes/palettes';
import { types } from './themes/types';
import { chromes } from './themes/chromes';
import { densities } from './themes/densities';

const facetMenu = (title: string, icon: string, list: { id: string; label: string }[]) => ({
  description: `${title} facet (overrides the theme's)`,
  toolbar: {
    title,
    icon,
    dynamicTitle: true,
    items: [{ value: FROM_THEME, title: `${title}: from theme` }, ...list.map((f) => ({ value: f.id, title: f.label }))],
  },
});

/** Toolbar menus: a theme pack, then each facet to mix in from another. */
export const libraryGlobalTypes = {
  theme: {
    description: 'Theme pack',
    toolbar: { title: 'Theme', icon: 'paintbrush', dynamicTitle: true, items: packs.map((p) => ({ value: p.id, title: p.label })) },
  },
  palette: facetMenu('Palette', 'contrast', palettes),
  type: facetMenu('Type', 'type', types),
  chrome: facetMenu('Chrome', 'component', chromes),
  density: facetMenu('Density', 'grow', densities),
};

export const libraryInitialGlobals = {
  theme: packs[0].id,
  palette: FROM_THEME,
  type: FROM_THEME,
  chrome: FROM_THEME,
  density: FROM_THEME,
};

export const withLibraryTheme: Decorator = (Story, context) => {
  const { facets } = resolveTheme(context.globals);
  return (
    <ThemeScope facets={facets}>
      <Story />
    </ThemeScope>
  );
};
