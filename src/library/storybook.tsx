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
import { FrameRoom, type StoryFrame } from './frame';
export { useFrameRoom, type StoryFrame } from './frame';

/** How the frame sits in the canvas: its scale and its offset (letterboxed, centred). */
interface Fit {
  s: number;
  x: number;
  y: number;
}

/**
 * The story at exactly `frame.w` × `frame.h`, scaled uniformly (a transform, origin top left,
 * so hit-testing and `getBoundingClientRect` stay right) to the largest box that fits the canvas,
 * centred, measured again whenever the canvas resizes. Layout inside is at design px: element
 * sizes and ResizeObservers see the frame's size, and `--story-frame-w` / `--story-frame-h` stand
 * in for `100vw` / `100vh`. What renders outside it (the top layer: native popovers, dialogs
 * shown modal) isn't scaled.
 */
function ScaledFrame({ frame, children }: { frame: StoryFrame; children: ReactNode }) {
  const box = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState<Fit | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      const s = Math.min(w / frame.w, h / frame.h);
      setFit((was) => {
        const next = { s, x: (w - frame.w * s) / 2, y: (h - frame.h * s) / 2 };
        return was && was.s === next.s && was.x === next.x && was.y === next.y ? was : next;
      });
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [frame.w, frame.h]);
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
    <div ref={box} data-story-canvas="" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div data-story-frame={`${frame.w}x${frame.h}`} style={inner}>
        <FrameRoom.Provider value={frame}>{children}</FrameRoom.Provider>
      </div>
    </div>
  );
}

/**
 * A full-window story drawn at its design window and scaled to the canvas, keeping the ratio:
 * set `parameters.frame = { w, h }` (and `layout: 'fullscreen'`). Without `frame` it does nothing.
 * Put it inside `withLibraryTheme` (before it in `decorators`, which wrap outward:
 * `[withVisualsFrame, withStoryFrame, withLibraryTheme]`), so the theme's desktop fills the
 * letterbox and the frame sits in the theme scope.
 */
export const withStoryFrame: Decorator = (Story, { parameters }) => {
  const frame = parameters.frame as StoryFrame | undefined;
  return frame ? (
    <ScaledFrame frame={frame}>
      <Story />
    </ScaledFrame>
  ) : (
    <Story />
  );
};

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
