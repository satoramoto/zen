import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { Region } from '../../layout/Region';
import { Screen } from '../../layout/Screen';
import { assemble, lengthSum, principlesFor, resolveLength, useForm, type Form, type Forms, type Length, type Principles, type RegionSpec, type ScreenSpec, type Units } from '../../layout/assembly';
import { useThemeScope } from '../../theme';
import { packs } from '../../themes/packs';
import { say } from '../model/words';
import type { Docks, InspectorMode, SidebarMode } from '../model/home-model';
import { HEADER_FORMS, Mark } from '../Views/Views';
import { HERO_FORMS } from '../Hero/Hero';
import { TRANSPORT_FORMS } from '../TransportBar/TransportBar';
import './HomeLayout.css';

/* ---------- the home's parts, declared (docs/assembly.md) ---------- */

/** The title bar's 52px: the header row's height (`--vs-lay-titlebar`). */
export const TITLEBAR: Units = { space: [6, 4, 1] };

/** The side panels' forms. Docked: the panel and its 8px window inset (the seam beside it is the screen's gap). Overlaid: nothing in the row; laid over the column when open. */
export type PanelForm = 'docked' | 'overlaid';

/** The inset sidebar: 240px (eight controls, `--vs-lay-side`) and its 8px inset from the window. */
export const SIDEBAR_FORMS: Forms<PanelForm> = [
  { id: 'docked', min: { w: { control: 8, space: 2 }, h: { control: 8 } }, ideal: { w: { control: 8, space: 2 }, h: { control: 8 } } },
  { id: 'overlaid', min: { w: 0, h: 0 }, ideal: { w: 0, h: 0 } },
];

/** The inspector: 288px (`--vs-lay-insp`, 72 units) and its 8px inset from the window. */
export const INSPECTOR_FORMS: Forms<PanelForm> = [
  { id: 'docked', min: { w: { unit: 72, space: 2 }, h: { control: 8 } }, ideal: { w: { unit: 72, space: 2 }, h: { control: 8 } } },
  { id: 'overlaid', min: { w: 0, h: 0 }, ideal: { w: 0, h: 0 } },
];

/** The tiles' size in each of the grid's forms: 150px wide (five controls), 124px small (31 units): the original's HOME_TILE. */
export const PANE_TILE: Record<PaneForm, Units> = { wide: { control: 5 }, small: { unit: 31 } };
export type PaneForm = 'wide' | 'small';

/**
 * The grid under the hero (the pane): its tiles' size is its form. Wide wants five 150px tiles
 * and their 12px gaps (798px); narrower than that its tiles go small (three of 124px at least).
 * It grows both ways and scrolls; it ranks lowest, so the tiles shrink before a panel undocks.
 */
export const PANE_FORMS: Forms<PaneForm> = [
  { id: 'wide', min: { w: { control: 25, space: [3, 3, 3, 3] }, h: { control: 4 } }, ideal: { w: { control: 25, space: [3, 3, 3, 3] }, h: { control: 4 } }, grow: { w: true, h: true } },
  { id: 'small', min: { w: { unit: 93, space: [3, 3] }, h: { unit: 26 } }, ideal: { w: { unit: 93, space: [3, 3] }, h: { unit: 26 } }, grow: { w: true, h: true } },
];

/** The header's forms at the title bar's height, with `extra` room across. */
const headForms = (...extra: Length[]): Form[] =>
  HEADER_FORMS.map((f): Form => ({ ...f, min: { w: extra.length ? lengthSum(f.min.w, ...extra) : f.min.w, h: TITLEBAR }, ideal: { w: extra.length ? lengthSum(f.ideal.w, ...extra) : f.ideal.w, h: TITLEBAR } }));

/** The header's forms beside a docked sidebar (whose band holds the window buttons and the title). */
const HEAD_FORMS = headForms() as unknown as Forms;

/** The room the window buttons take from the window's left edge, 98px (`--vs-lay-lights-room`). */
export const LIGHTS_ROOM: Units = { space: [6, 6, 6], unit: 0.5 };

/** The app's title (`Mark`): its twelve characters, at the heading's size (an upper bound on the mark's own, padding and all). */
export const TITLE_W: Units = { chars: { heading: 'visual[flow]'.length } };

/** The header's forms with no sidebar docked: `titled` (the window buttons' room, the title, the full header), then the full and the narrow header after the buttons' room, the title folded away. */
export type HeadForm = 'titled' | 'full' | 'narrow';

/**
 * With no sidebar docked the header row is the title bar beside the window buttons, so it holds
 * their room and the app's title too. The title is the first to go (`titled` → `full`), before the
 * header narrows. Header reads `titled` as its own first form, `full`.
 */
export const HEAD_TITLED_FORMS = [{ ...headForms(LIGHTS_ROOM, TITLE_W)[0], id: 'titled' }, ...headForms(LIGHTS_ROOM)] as unknown as Forms<HeadForm>;

/** Which forms a side panel may take: either (the solver decides), or one, as its mode says. */
export type PanelChoice = PanelForm | 'either';

/**
 * Home's screen: what it holds and what matters, never a grid. One row: the sidebar, the main
 * column (the header, the hero, the pane, the bar, top to bottom) and the inspector. What is
 * playing (the hero) is `now`; the header and the bar are `controls`; the panels `context`, so
 * they go before the column narrows past the hero's ideal (that is where the original's 900 and
 * 1200 come from); the pane's tile size is `chrome`, the first to give. Every region is plateless:
 * the frost paints no plates, and the screen's 32px gap is the column's side room.
 */
export function homeSpec({ sidebar = 'either', inspector = 'either', hero = true, bar = true }: { sidebar?: PanelChoice; inspector?: PanelChoice; hero?: boolean; bar?: boolean } = {}): ScreenSpec {
  const pick = (forms: Forms<PanelForm>, c: PanelChoice): Forms => (c === 'either' ? forms : [forms.find((f) => f.id === c)!]);
  const region = (id: string, forms: Forms, priority: RegionSpec['priority']): RegionSpec => ({ id, forms, priority, plate: false });
  return {
    rows: [
      [
        region('sidebar', pick(SIDEBAR_FORMS, sidebar), 'context'),
        {
          id: 'column',
          rows: [
            // Pinned undocked (put away or laid over), the header holds the window buttons' room and the title; free to choose, the docking answer leaves them out.
            [region('header', sidebar === 'overlaid' ? HEAD_TITLED_FORMS : HEAD_FORMS, 'controls')],
            ...(hero ? [[region('hero', HERO_FORMS, 'now')]] : []),
            [region('pane', PANE_FORMS, 'chrome')],
            ...(bar ? [[region('bar', TRANSPORT_FORMS, 'controls')]] : []),
          ],
        },
        region('inspector', pick(INSPECTOR_FORMS, inspector), 'context'),
      ],
    ],
  };
}

/** Whether each side panel docks in a room (px): the home assembled with both free to choose. */
export function homeDocks(room: { w: number; h: number }, principles: Principles): Docks {
  const placed = assemble(homeSpec(), room, principles).regions;
  return { sidebar: placed.sidebar.form === 'docked', inspector: placed.inspector.form === 'docked' };
}

/**
 * The tile size the pane's form says, in px, for what draws the grid (`Library`'s `tileMin`):
 * rendered inside the pane, it reads the form the screen chose for it.
 */
export function PaneTile({ children }: { children: (tile: number) => ReactNode }) {
  const form = useForm(PANE_FORMS);
  const p = useLayoutPrinciples();
  return <>{children(resolveLength(PANE_TILE[form], p))}</>;
}

/** The visual[flow] pack: the principles where no theme scope says otherwise. */
const VISUALS_PACK = packs.find((p) => p.id === 'visuals') ?? packs[0];

/** The nearest theme scope's principles resolved (the visuals pack's outside one), as the assembled screen reads them. */
export function useLayoutPrinciples(): Principles {
  const scope = useThemeScope();
  return useMemo(() => principlesFor(scope?.facets ?? VISUALS_PACK.facets, scope?.principles ?? VISUALS_PACK.principles), [scope]);
}

/**
 * **Job.** Home as an inspector view (Finder's, Photos'): the inset sidebar down the left, the
 * main column beside it (the Now Playing hero pinned at its top, the grid or a pane scrolling
 * beneath, the bar along the bottom) and the inspector down the right. The shell owns the
 * landmarks, the sizes (HomeLayout.css's `--vs-lay-*`, and `--lay-tile` / `--lay-tile-gap` for
 * the stories' grid), how each side panel shows (docked, laid over the main column, or put away)
 * and who paints what; each slot's content is its own component: `InsetSidebar`, `Hero`, the
 * grid, `TransportBar`, `Inspector`.
 *
 * **Changed.** It is an assembled library `Screen` (`homeSpec`, docs/assembly.md): six plateless
 * regions, the sidebar, then the main column's header, hero, pane and bar, then the inspector,
 * each declaring its forms in scale units. The solver places them: no grid, no breakpoint, no
 * measured column. Where the side panels dock (the original's 900 and 1200 px) is `homeDocks`,
 * the same spec with both panels free to choose; the caller turns that and the viewer's choices
 * into modes (`modesFor`), and this draws the modes it is given, each panel pinned to its form.
 * The header goes narrow, the hero compact and the tiles small by their forms (`HEADER_FORMS`,
 * `HERO_FORMS`, `PANE_FORMS`). As in the original, the sidebar runs the window's full height with
 * a band at its top for the window buttons, and the header row is the column's first row beside
 * it. Unlike the original (whose mark sat under the band, InsetSidebar's first item), the app's
 * title (`Mark`) sits in that band after the window buttons' room, taking no presses so the band
 * still drags the window; with no sidebar docked it is the header row's first item, after the
 * same room (`HEAD_TITLED_FORMS`: the room and the title are the header's needs then, and the
 * title folds away before the header narrows). In full screen the room is nothing. A panel laid over the column takes no room in the row (its `overlaid` form) and is drawn
 * from its slot at the window's edge, in the `Opaque` scope (its class on the cell itself, so
 * the panel is not remounted when it turns from docked to laid over), which draws every layer
 * solid: the native preview under it would show through anything less. Panels are the `raised`
 * layer with the glass edge; laid over, the `overlay` layer's cast. Nothing animates.
 *
 * **Kept.** Every export, prop and default; the landmarks (`nav` "sources", `main`, the "now
 * playing" region, the `aside`); focus moving into a panel laid over the column and back when it
 * goes; Escape or a press outside dismissing it, a press on a control naming the panel in
 * `aria-controls` counting as inside; the hero never scrolling.
 *
 * From the original: the hero's picture is the native preview's hole (`Preview`, placed under
 * the page each frame), and a scroll container can't clip that view, so the hero never scrolls:
 * only the pane under it does. Nothing paints under the hole: the root paints nothing, and the
 * picture's own spread shadow (Hero.css) paints the window's tint everywhere else, the panels,
 * header, pane and bar sitting above it with no background of their own. With no hero the
 * docked panels' cells are the plain `base` plate.
 *
 * **Tuning knobs** (HomeLayout.css, on `.vs-lay` and `.vs-lay-panel`; Hero, InsetSidebar and
 * TransportBar read them, never set them). Each is a scale expression equal to the original's
 * px under the roomy scale: `--vs-lay-*`:
 * - `--vs-lay-window-radius` (26px): the window's corners, stories only.
 * - `--vs-lay-side` (240px), `--vs-lay-side-radius` (18px): the inset sidebar's width and corners.
 * - `--vs-lay-titlebar` (52px): the header row; `--vs-lay-band` (36px) the sidebar's top band,
 *   which holds the title: the title bar less the panel's inset above and below, so the title
 *   sits on the header row's line.
 * - `--vs-lay-lights-room` (98px, `LIGHTS_ROOM`; 0 in full screen): the room the title and a
 *   header leave the window buttons.
 * - `--vs-lay-row` (40px): a sidebar row.
 * - `--vs-lay-key-radius` (6px): a small key's corners.
 * - `--vs-lay-hero-radius` (18px): the hero's corners.
 * - `--vs-lay-insp` (288px): the inspector's width.
 * - `--vs-lay-z-over-hole`, `--vs-lay-z-overlay`: what stacks over the hero's shadow, and the
 *   panels laid over the column.
 * The docked panels' widths and the title bar's height are also declared needs
 * (`SIDEBAR_FORMS`, `INSPECTOR_FORMS`, `TITLEBAR`, `LIGHTS_ROOM`, `TITLE_W`), which the solver places by.
 * Also `--lay-tile` (200px) and `--lay-tile-gap` (`--space-4`), the stories' grid.
 */
export interface HomeLayoutProps {
  /** The sidebar's content (`InsetSidebar`), inside the inset panel, a `nav`. */
  sidebar: ReactNode;
  /** What the sidebar is called to a screen reader; "sources", as today's. */
  sidebarLabel?: string;
  /** The header row at the top of the main column (`Header`). */
  header: ReactNode;
  /** The Now Playing card pinned at the top of the main column (`Hero`), in a region named "now playing"; it never scrolls. */
  hero?: ReactNode;
  /** What scrolls under the hero (the grid, or a story's tiles), unless `pane` is given. */
  children?: ReactNode;
  /** The bar along the bottom of the main column: the transport. */
  bar?: ReactNode;
  /** Draw a stand-in for the native window buttons and round the window's corners (stories: the real ones are macOS's). */
  lights?: boolean;
  /** The inspector (`Inspector`), in an inset panel down the right mirroring the sidebar, a named `aside`. None: closed, whatever `inspectorMode` says. */
  inspector?: ReactNode;
  /** What the inspector is called to a screen reader. */
  inspectorLabel?: string;
  /** How the sidebar shows (home-model's `modesFor`): beside the main column, put away, or laid over it. */
  sidebarMode?: SidebarMode;
  /** How the inspector shows when given: beside the main column, or laid over it; null: closed. Docked by default. */
  inspectorMode?: InspectorMode;
  /** Put away what is laid over the main column (the overlay sidebar or inspector): Escape, or a press outside it. A press on a control naming the panel in `aria-controls` (`SIDEBAR_ID`, `INSPECTOR_ID`: its toggle) counts as inside. */
  onDismiss?(): void;
  /** A pane under the hero in place of `children` (Home's grid, a playlist's): it fills the rest of the column and scrolls itself, with its own side padding (the column adds none and doesn't scroll). */
  pane?: ReactNode;
}

/** What the inspector is called by default. */
export const INSPECTOR_LABEL = 'about the preset';

/** The side panels' ids: a toggle names its panel in `aria-controls`, and a press on it doesn't dismiss the panel laid over the column. */
export const SIDEBAR_ID = 'lay-sidebar';
export const INSPECTOR_ID = 'lay-inspector';

/**
 * The class a header's panel toggle wears (the sidebar's and the inspector's buttons, the
 * original's `insp-toggle`): a glyph with no box, brighter while its panel is open. Add
 * `TOGGLE_SIDE` for the sidebar's, whose glyph faces left.
 */
export const TOGGLE_CLASS = 'vs-lay-toggle';
export const TOGGLE_SIDE = 'vs-lay-toggle--side';

/** The inspector's inset panel: HomeLayout's right slot, and the inspector's frame on its own in a story. */
export function InspectorPanel({ label = INSPECTOR_LABEL, id, children, panelRef }: { label?: string; id?: string; children: ReactNode; panelRef?: RefObject<HTMLElement | null> }) {
  return (
    <aside className="vs-lay-panel vs-lay-insp" id={id} aria-label={label} ref={panelRef} tabIndex={-1}>
      <div className="vs-lay-insp-body">{children}</div>
    </aside>
  );
}

/**
 * The sidebar's inset panel: HomeLayout's left slot, and the sidebar's frame on its own in a
 * story (the original's story drew it by hand). `lights` draws the window buttons' stand-in at
 * its corner.
 */
export function SidebarPanel({ label = 'sources', id, children, panelRef, lights = false }: { label?: string; id?: string; children: ReactNode; panelRef?: RefObject<HTMLElement | null>; lights?: boolean }) {
  return (
    <nav className="vs-lay-panel vs-lay-side" id={id} aria-label={label} ref={panelRef} tabIndex={-1} data-lights={lights ? '' : undefined}>
      {lights && <Lights />}
      <div className="vs-lay-side-band" data-tauri-drag-region>
        <WindowTitle />
      </div>
      <div className="vs-lay-side-body">{children}</div>
    </nav>
  );
}

/** The app's title beside the window buttons: the mark, taking no presses, so a drag on it moves the window. */
function WindowTitle() {
  return (
    <span className="vs-lay-title">
      <Mark />
    </span>
  );
}

/** The title in the header row (no sidebar docked), while the header's form has room for it. */
function HeadTitle() {
  return useForm(HEAD_TITLED_FORMS) === 'titled' ? <WindowTitle /> : null;
}

/** The native window buttons' stand-in (stories only; Live's stories lay it over the Stage). */
export function Lights() {
  return (
    <span className="vs-lay-lights" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** What can take focus inside a panel, in order. */
const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * A side panel laid over the main column: when it appears (not when a docked
 * one turns into it, the window narrowing), focus moves into it, and when it
 * goes, back to where it was, if it was in the panel then.
 */
function useOverlayFocus(panel: RefObject<HTMLElement | null>, mode: 'docked' | 'overlay' | null) {
  const was = useRef(mode);
  const opener = useRef<Element | null>(null);
  const overlay = mode === 'overlay';
  useEffect(() => {
    const el = panel.current;
    if (overlay && was.current === null && el) {
      opener.current = document.activeElement;
      const first = el.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? el).focus();
    }
    was.current = mode;
  }, [mode, overlay, panel]);
  // When the panel goes, focus lost with it goes back to its opener; a panel that docks instead (the window widening) keeps it.
  useEffect(() => {
    if (!overlay) return;
    return () => {
      const back = opener.current;
      opener.current = null;
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      if (lost && back instanceof HTMLElement && back.isConnected) back.focus();
    };
  }, [overlay, panel]);
}

/** Escape, or a press outside every panel laid over the column (and their toggles), calls `dismiss`. */
function useDismiss(side: RefObject<HTMLElement | null>, insp: RefObject<HTMLElement | null>, ids: string[], dismiss: (() => void) | undefined) {
  const latest = useRef(dismiss);
  latest.current = dismiss;
  const on = ids.length > 0 && !!dismiss;
  const key = ids.join(' ');
  useEffect(() => {
    if (!on) return;
    const open = key.split(' ');
    const inside = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return true;
      if (side.current?.contains(target) || insp.current?.contains(target)) return true;
      const el = target instanceof Element ? target : target.parentElement;
      const toggle = el?.closest('[aria-controls]');
      const names = toggle?.getAttribute('aria-controls')?.split(/\s+/) ?? [];
      return names.some((n) => open.includes(n));
    };
    const press = (e: PointerEvent) => {
      if (!inside(e.target)) latest.current?.();
    };
    const keyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) latest.current?.();
    };
    document.addEventListener('pointerdown', press);
    window.addEventListener('keydown', keyDown);
    return () => {
      document.removeEventListener('pointerdown', press);
      window.removeEventListener('keydown', keyDown);
    };
  }, [on, key, side, insp]);
}

/** The window: the sidebar, the main column and the inspector, each shown as its mode says, assembled. */
export function HomeLayout({
  sidebar,
  sidebarLabel = 'sources',
  header,
  hero,
  children,
  bar,
  lights = false,
  inspector,
  inspectorLabel,
  sidebarMode = 'docked',
  inspectorMode = 'docked',
  onDismiss,
  pane,
}: HomeLayoutProps) {
  const side = useRef<HTMLElement | null>(null);
  const insp = useRef<HTMLElement | null>(null);
  const principles = useLayoutPrinciples();
  const inspMode = inspector ? inspectorMode : null;
  const sideOver = sidebarMode === 'overlay';
  const inspOver = inspMode === 'overlay';
  useOverlayFocus(side, sidebarMode === 'hidden' ? null : sidebarMode);
  useOverlayFocus(insp, inspMode);
  useDismiss(side, insp, [...(sideOver ? [SIDEBAR_ID] : []), ...(inspOver ? [INSPECTOR_ID] : [])], onDismiss);

  // Each panel pinned to the form its mode is: docked takes its room in the row, laid over or put away takes none.
  const sideForm: PanelForm = sidebarMode === 'docked' ? 'docked' : 'overlaid';
  const inspForm: PanelForm = inspMode === 'docked' ? 'docked' : 'overlaid';
  const hasHero = !!hero;
  const hasBar = !!bar;
  const spec = useMemo(() => homeSpec({ sidebar: sideForm, inspector: inspForm, hero: hasHero, bar: hasBar }), [sideForm, inspForm, hasHero, hasBar]);
  const cell = (mode: 'docked' | 'overlay', which: 'side' | 'insp') => `vs-lay-cell vs-lay-${which}-cell vs-lay-cell--${mode}${mode === 'overlay' ? ' lib-opaque' : ''}`;

  return (
    <div className="vs-lay" data-view="home" data-sidebar={sidebarMode} data-inspector={inspMode ?? undefined} data-hero={hero ? '' : undefined} data-lights={lights ? '' : undefined}>
      <Screen
        name="home"
        className="vs-lay-screen"
        spec={spec}
        principles={principles}
        regions={{
          sidebar:
            sidebarMode === 'hidden' ? null : (
              <Region name="sidebar" className={cell(sidebarMode, 'side')}>
                <SidebarPanel label={sidebarLabel} id={SIDEBAR_ID} panelRef={side}>
                  {sidebar}
                </SidebarPanel>
              </Region>
            ),
          header: (
            <div className="vs-lay-head" data-tauri-drag-region>
              {sidebarMode !== 'docked' && <HeadTitle />}
              {header}
            </div>
          ),
          hero: (
            <section className="vs-lay-hero" aria-label={say('stage')}>
              {hero}
            </section>
          ),
          pane: (
            <main className="vs-lay-main" data-pane={pane ? '' : undefined}>
              {pane ?? children}
            </main>
          ),
          bar: <div className="vs-lay-bar">{bar}</div>,
          inspector: inspMode ? (
            <Region name="inspector" className={cell(inspMode, 'insp')}>
              <InspectorPanel label={inspectorLabel} id={INSPECTOR_ID} panelRef={insp}>
                {inspector}
              </InspectorPanel>
            </Region>
          ) : null,
        }}
      />
      {lights && <Lights />}
    </div>
  );
}
