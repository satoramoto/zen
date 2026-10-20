// The Storybook toolbar, framework-free: `storybook.tsx` re-exports it.
import { FROM_THEME } from './resolve';
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

/** Zen's own Storybook only (not in `libraryGlobalTypes`, so an app's Storybook doesn't get it): which
 *  renderer draws a component converted to a view tree, React's `Tree` or Svelte's (`withRenderer`,
 *  `src/library/stories/story.tsx`). Other stories draw in React either way. */
export const rendererGlobalTypes = {
  renderer: {
    description: 'Which renderer draws the components drawn by a view tree',
    toolbar: {
      title: 'Renderer',
      icon: 'transfer',
      dynamicTitle: true,
      items: [
        { value: 'react', title: 'Renderer: React' },
        { value: 'svelte', title: 'Renderer: Svelte' },
      ],
    },
  },
};
export const rendererInitialGlobals = { renderer: 'react' };

/** The toolbar's starting choice: the first pack, the system's mode, every facet from the pack. */
export const libraryInitialGlobals = {
  theme: packs[0].id,
  mode: 'system',
  palette: FROM_THEME,
  faces: FROM_THEME,
  scale: FROM_THEME,
  materials: FROM_THEME,
};
