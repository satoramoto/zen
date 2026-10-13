// The Storybook entry of @satoramoto/zen: `@satoramoto/zen/storybook`, the toolbar globals and the
// decorators an app's own Storybook draws its stories with (zen's `.storybook/preview.ts` uses the
// same). `vite.lib.config.ts` builds it to `lib/storybook.js`. Storybook stays out of the main
// entry: only types come from it here.
//
//   import { libraryGlobalTypes, libraryInitialGlobals, withLibraryTheme, withStoryFrame } from '@satoramoto/zen/storybook';
//   export default { globalTypes: libraryGlobalTypes, initialGlobals: libraryInitialGlobals, decorators: [withStoryFrame, withLibraryTheme] };
import type { Decorator } from '@storybook/react-vite';
import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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

/** The toolbar's starting choice: the first pack, the system's mode, every facet from the pack. */
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

// The design window a story is drawn at (`parameters.frame`, in px); its context lives in
// frame.ts so app code can read it without importing anything from Storybook.
import { FrameRoom, type StoryFrame, type StoryFrameParam } from './frame';
export { useFrameRoom, type StoryFrame, type StoryFrameParam } from './frame';

/** The canvas's own size, followed as it is resized (null until measured). */
function useCanvasSize(box: { current: HTMLDivElement | null }, deps: readonly unknown[]): StoryFrame | null {
  const [size, setSize] = useState<StoryFrame | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setSize((was) => (was && was.w === w && was.h === h ? was : { w, h }));
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, deps);
  return size;
}

/** The canvas box every frame sits in: the whole story iframe. */
const CANVAS: CSSProperties = { position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' };

/**
 * `frame: 'fill'`: the story fills the canvas at its real size, unscaled, as a resizable window
 * does. `useFrameRoom()` reports the canvas's size (followed as it resizes), and
 * `--story-frame-w` / `--story-frame-h` are that size.
 */
function FillFrame({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement | null>(null);
  const size = useCanvasSize(box, []);
  const vars = (size ? { '--story-frame-w': `${size.w}px`, '--story-frame-h': `${size.h}px` } : {}) as CSSProperties;
  return (
    <div ref={box} data-story-canvas="" data-story-frame="fill" style={{ ...CANVAS, ...vars }}>
      <FrameRoom.Provider value={size}>{children}</FrameRoom.Provider>
    </div>
  );
}

/** How the frame sits in the canvas: its scale and its offset (letterboxed, centred). */
interface Fit {
  s: number;
  x: number;
  y: number;
}

/**
 * The story at exactly `frame.w` × `frame.h`, centred in the canvas, and scaled down uniformly
 * (a transform, origin top left, so hit-testing and `getBoundingClientRect` stay right) only when
 * the canvas is smaller than it, never up; measured again whenever the canvas resizes. Layout
 * inside is at design px: element sizes and ResizeObservers see the frame's size, and
 * `--story-frame-w` / `--story-frame-h` stand in for `100vw` / `100vh`. What renders outside it
 * (the top layer: native popovers, dialogs shown modal) isn't scaled.
 */
function ScaledFrame({ frame, children }: { frame: StoryFrame; children: ReactNode }) {
  const box = useRef<HTMLDivElement | null>(null);
  const canvas = useCanvasSize(box, [frame.w, frame.h]);
  const fit: Fit | null = canvas
    ? (() => {
        const s = Math.min(1, canvas.w / frame.w, canvas.h / frame.h);
        return { s, x: (canvas.w - frame.w * s) / 2, y: (canvas.h - frame.h * s) / 2 };
      })()
    : null;
  const inner = {
    position: 'absolute',
    left: fit?.x ?? 0,
    top: fit?.y ?? 0,
    width: frame.w,
    height: frame.h,
    transform: `scale(${fit?.s ?? 1})`,
    transformOrigin: '0 0',
    '--story-frame-w': `${frame.w}px`,
    '--story-frame-h': `${frame.h}px`,
  } as CSSProperties;
  return (
    <div ref={box} data-story-canvas="" style={CANVAS}>
      <div data-story-frame={`${frame.w}x${frame.h}`} style={inner}>
        <FrameRoom.Provider value={frame}>{children}</FrameRoom.Provider>
      </div>
    </div>
  );
}

/**
 * A full-window story's window (`parameters.frame`, with `layout: 'fullscreen'`):
 *
 * - `'fill'`: a fluid window. The story fills the canvas at its real size, unscaled; the room it
 *   lays out in is the canvas, followed as it resizes (`useFrameRoom()`).
 * - `{ w, h }`: a story named for a size ("At 900 px"). Drawn at that design window, centred, and
 *   scaled down (keeping the ratio) only when the canvas is smaller than it, never up.
 *
 * Without `frame` it does nothing. Put it inside `withLibraryTheme` (before it in `decorators`,
 * which wrap outward: `[withAppFrame, withStoryFrame, withLibraryTheme]` for an app's own frame decorator), so the theme's
 * desktop fills the letterbox and the frame sits in the theme scope.
 */
export const withStoryFrame: Decorator = (Story, { parameters }) => {
  const frame = parameters.frame as StoryFrameParam | undefined;
  if (frame === 'fill')
    return (
      <FillFrame>
        <Story />
      </FillFrame>
    );
  return frame ? (
    <ScaledFrame frame={frame}>
      <Story />
    </ScaledFrame>
  ) : (
    <Story />
  );
};

/** Draws the story in a `ThemeScope` of the toolbar's pack, mode and facets, on the pack's stand-in desktop. */
export const withLibraryTheme: Decorator = (Story, context) => {
  const { pack, facets } = resolveTheme(context.globals);
  const mode = (context.globals.mode as ModeChoice) ?? 'system';
  // A palette swapped in from another pack keeps this pack's desktop only if the pack's own palette is worn.
  const desktop = facets.palette === pack.facets.palette ? pack.desktop : undefined;
  return (
    <Desktop desktop={desktop} mode={mode}>
      <ThemeScope facets={facets} principles={pack.principles} mode={mode} bleed={context.parameters.layout === 'fullscreen'}>
        <Story />
      </ThemeScope>
    </Desktop>
  );
};
