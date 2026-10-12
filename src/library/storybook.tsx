import type { Decorator } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { FROM_THEME, ThemeScope, resolveTheme, useSystemMode, type ModeChoice } from './theme';
import { packs } from './themes/packs';
import { palettes } from './themes/palettes';
import { faces } from './themes/faces';
import { scales } from './themes/scales';
import { materials } from './themes/materials';

const facetMenu = (title: string, icon: string, list: { id: string; label: string }[]) => ({
  description: `${title} facet (overrides the theme's)`,
  toolbar: {
    title,
    icon,
    dynamicTitle: true,
    items: [{ value: FROM_THEME, title: `${title}: from theme` }, ...list.map((f) => ({ value: f.id, title: f.label }))],
  },
});

/** Toolbar menus: a theme pack, the mode, then each facet to mix in from another. */
export const libraryGlobalTypes = {
  theme: {
    description: 'Theme pack',
    toolbar: { title: 'Theme', icon: 'paintbrush', dynamicTitle: true, items: packs.map((p) => ({ value: p.id, title: p.label })) },
  },
  mode: {
    description: 'Light or dark; System follows the OS preference',
    toolbar: {
      title: 'Mode',
      icon: 'mirror',
      dynamicTitle: true,
      items: [
        { value: 'system', title: 'Mode: system' },
        { value: 'light', title: 'Light' },
        { value: 'dark', title: 'Dark' },
      ],
    },
  },
  palette: facetMenu('Palette', 'contrast', palettes),
  faces: facetMenu('Faces', 'type', faces),
  scale: facetMenu('Scale', 'grow', scales),
  materials: facetMenu('Materials', 'component', materials),
};

export const libraryInitialGlobals = {
  theme: packs[0].id,
  mode: 'system',
  palette: FROM_THEME,
  faces: FROM_THEME,
  scale: FROM_THEME,
  materials: FROM_THEME,
};

/** A translucent ground needs something behind it: the pack's stand-in desktop, per mode. */
function Desktop({ desktop, mode, children }: { desktop?: { light: string; dark: string }; mode: ModeChoice; children: ReactNode }) {
  const system = useSystemMode();
  if (!desktop) return <>{children}</>;
  const resolved = mode === 'system' ? system : mode;
  return <div style={{ background: desktop[resolved], minHeight: '100vh' }}>{children}</div>;
}

export const withLibraryTheme: Decorator = (Story, context) => {
  const { pack, facets } = resolveTheme(context.globals);
  const mode = (context.globals.mode as ModeChoice) ?? 'system';
  // A palette swapped in from another pack keeps this pack's desktop only if the pack's own palette is worn.
  const desktop = facets.palette === pack.facets.palette ? pack.desktop : undefined;
  return (
    <Desktop desktop={desktop} mode={mode}>
      <ThemeScope facets={facets} mode={mode} bleed={context.parameters.layout === 'fullscreen'}>
        <Story />
      </ThemeScope>
    </Desktop>
  );
};
