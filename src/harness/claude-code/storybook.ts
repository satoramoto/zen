// The Claude Code harness in zen's Storybook: its toolbar globals and the decorator that draws a
// `Harness/...` story inside a Claude Code pane, as awesome-claude's own Storybook does
// (its .storybook/preview.ts, ported). `.storybook/preview.ts` adds both beside the library's.
//
// - Surface: desktop or terminal (the hook gets that `e.surface`).
// - Pane theme: light, dark or an ANSI theme (the desktop draws an ANSI theme in its light or dark look).
// - Pane frame: a plain pane, or a copy of the desktop app's side pane beside a transcript.
// - Width: the pane's width in cells, narrowed to the canvas when it doesn't fit, as in the app.
// - Skin: the colours the kit wears, one per zen theme pack, or derived from zen's Theme/Palette toolbar.
//
// Every other story is left as it was.
import { createElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { addons } from 'storybook/preview-api';
import { resolveTheme } from '../../library/theme';
import { CELL, TERMINAL_THEMES } from './bench/render';
import type { TerminalTheme } from './bench/render';
import { DEFAULT_SKIN, SKINS } from './kit/skins';
import type { SkinId } from './kit/skins';
import { wear } from './kit/tokens';
import { skinOf } from './skins';

/** The `skin` choice that derives the skin from zen's Theme (and Palette) toolbar. */
export const SKIN_FROM_THEME = 'theme';

/** The harness's toolbar menus. */
export const harnessGlobalTypes = {
  surface: {
    description: 'Harness: where it draws',
    toolbar: { title: 'Surface', icon: 'browser', items: ['desktop', 'terminal'], dynamicTitle: true },
  },
  paneTheme: {
    description: 'Harness: the pane theme (the desktop draws an ANSI theme in its light or dark look)',
    toolbar: { title: 'Pane theme', icon: 'mirror', items: ['light', 'dark', 'light-ansi', 'dark-ansi'], dynamicTitle: true },
  },
  paneFrame: {
    description: 'Harness: around the story',
    toolbar: { title: 'Frame', icon: 'sidebaralt', items: ['pane', 'sidebar'], dynamicTitle: true },
  },
  columns: {
    // 115 and 180 are an expanded desktop pane, about 900px and 1400px across: wide enough for two and three flow columns.
    description: 'Harness: pane width in cells',
    toolbar: { title: 'Width', icon: 'expand', items: ['28', '36', '46', '60', '80', '100', '110', '115', '180'], dynamicTitle: true },
  },
  skin: {
    description: "Harness: the kit's colours (a theme pack's skin, or derived from zen's Theme/Palette toolbar)",
    toolbar: {
      title: 'Skin',
      icon: 'paintbrush',
      dynamicTitle: true,
      items: [
        ...Object.entries(SKINS).map(([id, s]) => ({ value: id, title: `Skin: ${s.label}` })),
        { value: SKIN_FROM_THEME, title: "Skin: from zen's Theme/Palette" },
      ],
    },
  },
};

/** The harness toolbar's starting choice. */
export const harnessInitialGlobals = { surface: 'desktop', paneTheme: 'dark', paneFrame: 'sidebar', columns: '100', skin: DEFAULT_SKIN };

/** Wears the skin the toolbar picked. */
const wearChosen = (globals: Record<string, any>) => {
  const chosen = String(globals.skin ?? DEFAULT_SKIN);
  if (chosen === SKIN_FROM_THEME) wear(skinOf(resolveTheme(globals).facets.palette));
  else wear(chosen in SKINS ? (chosen as SkinId) : DEFAULT_SKIN);
};

/** The canvas's margin around the frame, each side. */
const GUTTER = 16;
/** What a frame adds around its body, left and right together: the side pane's padding and divider, or the plain pane's padding. */
const CHROME = { sidebar: 23.5, pane: 24 };
/** The narrowest the transcript beside the side pane is drawn. */
const TRANSCRIPT = 120;

// The fitted width depends on the canvas, which settles after the first draw and changes as the
// window resizes; whenever it differs from the one last drawn at, a harness story draws again.
let drawnAt = 0;
let active = false;
let redraw: ReturnType<typeof setTimeout> | undefined;
/** The canvas's width less its scrollbar: Storybook's body is what scrolls, so it's measured, not the page. */
const canvas = () => (document.body ?? document.documentElement).clientWidth;
let watching = false;
const watch = () => {
  if (watching) return;
  watching = true;
  new ResizeObserver(() => {
    if (!active || canvas() === drawnAt) return;
    clearTimeout(redraw);
    redraw = setTimeout(() => addons.getChannel().emit('forceReRender'), 100);
  }).observe(document.documentElement);
};

const e = createElement;

/**
 * Draws a `Harness/...` story inside a pane of the chosen surface, theme and width, in the chosen
 * skin; with Frame set to "sidebar", inside a copy of the desktop app's side pane (its title bar,
 * expand and close marks, the divider beside the transcript), from a capture.
 *
 * As in the app, the pane never runs past the window: when the chosen width doesn't fit, the pane
 * narrows to the room there is and the story is told the columns that fit, so it lays out at that
 * width rather than spilling over.
 */
export const withHarness: Decorator = (Story, ctx) => {
  if (!ctx.title.startsWith('Harness/')) {
    if (active) {
      active = false;
      document.documentElement.classList.remove('cc-harness');
    }
    return Story();
  }
  active = true;
  injectStyle();
  watch();
  document.documentElement.classList.add('cc-harness');
  wearChosen(ctx.globals);

  const surface = String(ctx.globals.surface ?? 'desktop');
  const chosen = String(ctx.globals.paneTheme ?? 'dark') as TerminalTheme;
  // The desktop has two looks; an ANSI theme draws it in the look it's named after.
  const theme = surface === 'terminal' ? `terminal term-${TERMINAL_THEMES.includes(chosen) ? chosen : 'dark'}` : chosen.replace(/-ansi$/, '');
  const sidebar = ctx.globals.paneFrame === 'sidebar' && surface !== 'terminal';
  drawnAt = canvas();
  const room = drawnAt - 2 * GUTTER - (sidebar ? CHROME.sidebar : CHROME.pane);
  // A terminal cell (1ch of 13px SF Mono) is as wide as a desktop cell.
  const columns = Math.max(1, Math.min(Number(ctx.globals.columns ?? 100), Math.floor(room / CELL.col)));
  const content = Story({ globals: { ...ctx.globals, columns: String(columns) } }) as ReactNode;
  const width = surface === 'terminal' ? `${columns}ch` : `${columns * CELL.col}px`;

  let frame: ReactElement;
  if (sidebar) {
    // With too little room left for the transcript, the side pane takes the whole window, without the divider.
    const alone = room - columns * CELL.col < TRANSCRIPT;
    // The pane's title, as the mod's `$.ui.open({ title })` gives it: a story's `paneTitle`, else the last part of its title.
    const title = String(ctx.parameters.paneTitle ?? ctx.title.split('/').pop() ?? '');
    frame = e(
      'div',
      { className: `app ${theme}${alone ? ' alone' : ''}` },
      e('div', { className: 'transcript' }, e('div', { className: 'bubble-msg' }), e('div', { className: 'bubble-msg short' }), e('div', { className: 'bubble-msg' })),
      e(
        'div',
        { className: 'side' },
        e('div', { className: 'side-head' }, e('span', null, title), e('span', { className: 'marks' }, e('span', { className: 'mark on' }, '⤢'), e('span', { className: 'mark' }, '✕'))),
        e('div', { className: 'side-body', style: { width } }, content),
      ),
    );
  } else {
    frame = e('div', { className: `pane ${theme}` }, e('div', { className: 'body', style: { width } }, content));
  }
  return e('div', { className: 'cc-harness-root' }, frame);
};

let styled = false;
/** The frame's CSS, scoped to the harness (`:where()` keeps each rule's own weight, so the bench's rules still win where the original's did). */
const injectStyle = () => {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.dataset.ccHarness = '';
  const at = ':where(.cc-harness-root)';
  style.textContent = `
  /* Room for the scrollbar always, so the width the frame is fitted to doesn't shrink once a tall story draws. */
  html.cc-harness { scrollbar-gutter: stable; }
  html.cc-harness body { margin: 0; overflow-x: hidden; }
  .cc-harness-root { padding: ${GUTTER}px; font: 13px/19px -apple-system, BlinkMacSystemFont, system-ui, sans-serif; color: CanvasText; }
  /* The browser's defaults, as awesome-claude's Storybook draws on them, rather than zen's page resets (styles.css). */
  .cc-harness-root, .cc-harness-root * { box-sizing: content-box; -webkit-font-smoothing: auto; -moz-osx-font-smoothing: auto; font-synthesis: weight style small-caps; font-optical-sizing: auto; }
  .cc-harness-root :is(button, a, input, select, summary):focus-visible { outline: revert; outline-offset: revert; }
  ${at} .pane { display: inline-block; border-radius: 10px; padding: 12px; }
  ${at} .pane.light { background: #fbfbfa; color: #1d1d1f; color-scheme: light; }
  ${at} .pane.dark { background: #1f1f1e; color: #ececec; color-scheme: dark; }
  ${at} .pane.terminal { background: #101014; color: #d8d8d8; font: 13px/1.25 'SF Mono', Menlo, monospace; }
  /* Links read by their colour alone, no underline. */
  ${at} .link { color: #6e8efb; text-decoration: none; }
  /* The desktop app's side pane, from a capture of it (dark), and its light counterpart. */
  ${at} .app { display: flex; height: 640px; border-radius: 10px; overflow: hidden; font-size: 12.5px; }
  ${at} .app.dark { background: #1c1c1c; color: #e8e8e6; color-scheme: dark; --muted: #8f8f8c; --line: #2c2c2b; --mark: #2e5bd8; }
  ${at} .app.light { background: #faf9f5; color: #1f1e1d; color-scheme: light; --muted: #8a8780; --line: #e6e3da; --mark: #2e5bd8; }
  /* The transcript takes what the side pane leaves, down to nothing; its side margins sit on the bubbles so it can. */
  ${at} .app .transcript { flex: 1 1 220px; min-width: 0; overflow: hidden; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
  ${at} .app .bubble-msg { margin: 0 16px; height: 34px; border-radius: 8px; background: var(--line); opacity: 0.6; }
  ${at} .app .bubble-msg.short { width: 60%; align-self: flex-end; }
  ${at} .app .side { flex: none; display: flex; flex-direction: column; border-left: 1px solid var(--line); }
  ${at} .app.alone .transcript { display: none; }
  ${at} .app.alone .side { flex: 1; border-left: none; }
  ${at} .app .side-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; color: var(--muted); }
  ${at} .app .marks { display: flex; gap: 10px; }
  ${at} .app .mark.on { color: var(--mark); border: 1px solid var(--mark); border-radius: 5px; padding: 0 3px; }
  /* The real side pane's body starts 12.5px in from its divider (measured on 2.1.295). */
  ${at} .app .side-body { padding: 4px 10px 10px 12.5px; overflow: auto; }
  /* The app's thin, rounded scrollbar on a bare track, rather than the browser's own. */
  ${at} .app .side-body::-webkit-scrollbar { width: 8px; background: transparent; }
  ${at} .app .side-body::-webkit-scrollbar-thumb { background: color-mix(in srgb, currentColor 22%, transparent); border-radius: 4px; border: 2px solid transparent; background-clip: padding-box; }
  ${at} .app .side-body::-webkit-scrollbar-thumb:hover { background-color: color-mix(in srgb, currentColor 38%, transparent); }
  ${at} .button { font: inherit; color: inherit; background: none; border: none; padding: 0; cursor: pointer; }
`;
  document.head.append(style);
};
