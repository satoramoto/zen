import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Layer, Opaque } from '../../layout/Layer';
import { Region } from '../../layout/Region';
import { Screen } from '../../layout/Screen';
import { assemble, lengthSum, type Form, type Forms, type Length, type Principles, type RegionSpec, type ScreenSpec, type Units } from '../../layout/assembly';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { LEAVE_HOLD_MS } from '../model/liveKeys';
import { isTyping } from '../model/shell';
import { crateModeFor, STAGE_CRATE_ID, type CrateMode, type StageLayoutProps } from '../model/stage-model';
import { say } from '../model/words';
import { Preview } from '../Views/Views';
import { useLayoutPrinciples } from '../HomeLayout/HomeLayout';
import { STAGE_DOCK_FORMS } from '../StageDock/StageDock';
import { STAGE_HEAD_FORMS } from '../StageHead/StageHead';
import './StageLayout.css';

/* ---------- the Stage's parts, declared (docs/assembly.md) ---------- */

/** The panels' 8px inset from the window's edges. */
const INSET: Units = { space: 2 };
/** The window buttons' room at the header's start, 84px: x 24, three 12px buttons 8px apart, and 8px after. */
export const LIGHTS: Units = { space: [5, 3, 3, 3, 2, 2, 2] };
/** The hint's strip with the panels hidden: 96px. */
const PEEK: Units = { space: [6, 6, 6] };

/** The crate: Home's 240px inset sidebar and its 8px inset from the window; laid over, nothing in the row. */
export const CRATE_FORMS: Forms<'docked' | 'overlaid'> = [
  { id: 'docked', min: { w: { control: 8, space: 2 }, h: { control: 8 } }, ideal: { w: { control: 8, space: 2 }, h: { control: 8 } } },
  { id: 'overlaid', min: { w: 0, h: 0 }, ideal: { w: 0, h: 0 } },
];

/**
 * The picture's open middle (what is playing, `now`): it grows into all the room the panels
 * leave. `open` wants 820px across, the room the original kept beside a docked crate (its 1100px
 * window less the crate's column), so the crate goes before the middle narrows past it; `framed`
 * is any narrower middle.
 */
export const CENTRE_FORMS: Forms<'open' | 'framed'> = [
  { id: 'open', min: { w: { unit: 205 }, h: { control: 4 } }, ideal: { w: { unit: 205 }, h: { control: 4 } }, grow: { w: true, h: true } },
  { id: 'framed', min: { w: { control: 10 }, h: { control: 4 } }, ideal: { w: { control: 10 }, h: { control: 4 } }, grow: { w: true, h: true } },
];

/** Forms with room added on each axis (a panel's insets, the lights' room). */
function padded(forms: Forms, w: Length, h: Length): Forms {
  const add = (n: Form['min']) => ({ w: lengthSum(n.w, w), h: lengthSum(n.h, h) });
  return forms.map((f): Form => ({ ...f, min: add(f.min), ideal: add(f.ideal) })) as unknown as Forms;
}

/** How the crate takes part: free to dock or not (`either`), docked, or out of the row (laid over or put away). */
export type CrateChoice = 'either' | 'docked' | 'none';

/**
 * The Stage's screen: the crate down the left, and beside it a column of the header, the
 * picture's open middle and the dock (or, with the panels hidden, the hint's strip). The middle
 * is `now`; the crate `context`; the header and the dock `chrome`, so they shorten their words
 * before the crate undocks (as the original: crate docked, dock compact at 1100px). Every region
 * is plateless: the panels are the parts' own, over the picture.
 */
export function stageSpec({ crate = 'either', panels = true }: { crate?: CrateChoice; panels?: boolean } = {}): ScreenSpec {
  const region = (id: string, forms: Forms, priority: RegionSpec['priority']): RegionSpec => ({ id, forms, priority, plate: false });
  // Beside a docked crate the header starts at the seam; otherwise it leaves the window buttons their room.
  const head = padded(STAGE_HEAD_FORMS, crate === 'none' ? lengthSum(LIGHTS, INSET) : INSET, 0);
  const dock = padded(STAGE_DOCK_FORMS, { space: [2, 2] }, INSET);
  const peek: Forms = [{ id: 'peek', min: { w: 0, h: PEEK }, ideal: { w: 0, h: PEEK }, grow: { w: true } }];
  const column = {
    id: 'column',
    rows: [[region('head', head, 'chrome')], [region('centre', CENTRE_FORMS, 'now')], [panels ? region('dock', dock, 'chrome') : region('peek', peek, 'chrome')]],
  };
  if (crate === 'none') return { rows: [[column]] };
  return { rows: [[region('crate', crate === 'docked' ? [CRATE_FORMS[0]] : CRATE_FORMS, 'context'), column]] };
}

/** Whether the crate docks in a room (px): the Stage assembled with the crate free to choose. */
export function crateDocks(room: { w: number; h: number }, principles: Principles): boolean {
  return assemble(stageSpec(), room, principles).regions.crate.form === 'docked';
}

/** What the crate is called to a screen reader. */
export const CRATE_LABEL = say('crate');

/** Where a press belongs to something laid over the crate (Settings, More effects, Help, popovers), not outside it. */
const OVER_CRATE = '[role="dialog"], .vs-sheet, .vs-popover-panel, [data-layer="float"], [data-layer="overlay"]';

/** Typing in a field, where Escape is the field's (liveKeys' `isTyping`, and contenteditable). */
function typing(e: KeyboardEvent): boolean {
  const t = e.target;
  return isTyping(e) || (t instanceof Element && (t.closest('[contenteditable]:not([contenteditable="false"])') != null || (t instanceof HTMLElement && t.isContentEditable)));
}

/** What the dock's panel is called to a screen reader. */
export const DOCK_LABEL = 'Live controls';

/** The quiet way back with the panels hidden, shown when the pointer nears the bottom. */
export const PANELS_HINT = 'for controls';

/** The hint's name to a screen reader: it is a button that shows the panels. */
export const PANELS_HINT_LABEL = 'Show controls (\\)';

/** What the progress says while Esc is held to leave live. */
export const LEAVING_TEXT = 'Keep holding Esc to leave live';

/**
 * Esc held toward leaving: a ring filling over `LEAVE_HOLD_MS` from the press,
 * and the line saying to keep holding, in an opaque card over the picture's
 * middle. It shows after a beat (StageLayout.css), so a short press shows nothing.
 */
function Leaving() {
  return (
    <div className="vs-stagelayout-leaving" role="status" style={{ '--vs-stagelayout-hold': `${LEAVE_HOLD_MS}ms` } as CSSProperties}>
      <Layer level="top" className="vs-stagelayout-leaving-card">
        <svg className="vs-stagelayout-ring" viewBox="0 0 40 40" aria-hidden="true">
          <circle className="vs-stagelayout-ring-track" cx="20" cy="20" r="17" />
          <circle className="vs-stagelayout-ring-fill" cx="20" cy="20" r="17" pathLength={1} />
        </svg>
        <Text as="p" weight="strong" className="vs-stagelayout-leaving-line">
          {LEAVING_TEXT}
        </Text>
      </Layer>
    </div>
  );
}

/** What can take focus inside a panel, in order. */
const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

/**
 * The laid-over crate: focus goes into it when it appears (not when a docked
 * one turns into it, the window narrowing), and back to where it was when it
 * goes, if it was lost with it (HomeLayout's way).
 */
function useOverlayFocus(panel: RefObject<HTMLElement | null>, mode: CrateMode) {
  const was = useRef(mode);
  const opener = useRef<Element | null>(null);
  const overlay = mode === 'overlay';
  useEffect(() => {
    const el = panel.current;
    if (overlay && was.current === 'hidden' && el) {
      opener.current = document.activeElement;
      (el.querySelector<HTMLElement>(FOCUSABLE) ?? el).focus();
    }
    was.current = mode;
  }, [mode, overlay, panel]);
  useEffect(() => {
    if (!overlay) return;
    return () => {
      const back = opener.current;
      opener.current = null;
      const active = document.activeElement;
      const lost = !active || active === document.body || !active.isConnected;
      if (lost && back instanceof HTMLElement && back.isConnected) back.focus();
    };
  }, [overlay]);
}

/**
 * Escape, or a press outside the laid-over crate and its toggle (a control
 * naming `STAGE_CRATE_ID` in `aria-controls`), calls `away`. Escape is taken
 * (`preventDefault`), so live mode's keys don't also act on the press (held on,
 * it still leaves live).
 */
function useDismiss(on: boolean, panel: RefObject<HTMLElement | null>, away: () => void) {
  const latest = useRef(away);
  latest.current = away;
  useEffect(() => {
    if (!on) return;
    const press = (e: PointerEvent) => {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (panel.current?.contains(t)) return;
      const el = t instanceof Element ? t : t.parentElement;
      const names = el?.closest('[aria-controls]')?.getAttribute('aria-controls')?.split(/\s+/) ?? [];
      if (names.includes(STAGE_CRATE_ID)) return;
      if (el?.closest(OVER_CRATE)) return;
      latest.current();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || typing(e)) return;
      e.preventDefault();
      latest.current();
    };
    document.addEventListener('pointerdown', press);
    window.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', press);
      window.removeEventListener('keydown', key);
    };
  }, [on, panel]);
}

/**
 * **Job.** Live's Stage: the picture full-bleed across the main window, the
 * panels laid over it (see `StageLayoutProps`). The shell owns where each part
 * goes and the crate's and the dock's inset panels: the crate (`crate`) is the
 * content of a `nav` (`STAGE_CRATE_ID`) down the left, docked where its needs
 * fit beside the picture's open middle (`crateDocks`: from 1100px; the header
 * and the dock keep clear of it) and laid over everything elsewhere, where Escape or a press outside it calls `onCrateAway`;
 * the dock (`dock`) is the content of a panel along the bottom ("Live
 * controls"); the header (`head`) is a row on the traffic lights' line, its
 * capsules painting themselves, the empty line between them a drag region.
 * Hidden panels (`panels.shown` false) leave only the picture and a hint, shown
 * as the pointer nears the bottom, that `\` brings them back. With the warning
 * owed the picture is dark (the preview isn't mounted), the crate and the dock
 * inert and dimmed, and `centre` (the warning) centred where the picture would
 * be, even with the panels hidden. While Esc is held to leave live (`leaving`),
 * its progress shows over everything; the output never shows it.
 *
 * **Changed.** The window is an assembled layout `Screen` (`stageSpec`,
 * docs/assembly.md) over the picture: Views' `Preview` (a measured `Hole`) fills
 * the window under it, and the solver places the parts over it (`crate`, `head`,
 * `centre`, `dock`, or `peek` with the panels hidden), so the picture never moves
 * whatever shows. The header and the dock take their forms (`STAGE_HEAD_FORMS`,
 * `STAGE_DOCK_FORMS`) from the room they are given, not from a query; a crate
 * laid over takes no room and is drawn over everything at the left. Everything over the picture sits in one `Opaque` scope, so each
 * layer draws its solid and no backdrop (never translucent over the native view).
 * The dock's panel is a `Region` (the base layer, named "Live controls"); the
 * crate's panel a base `Layer` rendered as the `nav`, its focus target the panel
 * inside it (Layer takes no ref). The header row stays a plain slot, not a
 * Region: it paints nothing, and StageHead's `header` keeps its banner role. The
 * hint shows at once (no fade); the leaving card shows after its beat without a
 * fade: the ring is the one animation left.
 *
 * **Kept.** Every export, the data attributes on the root, the crate's focus and
 * dismissal, the drag regions, the warning's dark window, the copy.
 *
 * **Tuning knobs** (StageLayout.css), sizes the scale has no step for (the
 * crate's width, the title bar, the lights' room and the insets are also the
 * declared needs above, which the solver places by):
 * - `--vs-stagelayout-crate`: the laid-over crate's column, the 240px inset sidebar and 8px either side.
 * - `--vs-stagelayout-titlebar`: the title bar's 52px (layout.css `--lay-titlebar`).
 * - `--vs-stagelayout-lights`: the window buttons' room, 84px.
 * - `--vs-stagelayout-radius`: the inset panels' 18px corners (layout.css `--lay-side-radius`).
 * - `--vs-stagelayout-z-*`: the cells' stacking over the picture.
 * - `--vs-stagelayout-hold`: Esc's hold (`LEAVE_HOLD_MS`), set inline on the progress.
 * - `--vs-hole-radius`: Views' `Preview` knob, set to 0 here (the picture is square; macOS rounds the window).
 */
export function StageLayout({ width, height = 900, panels, warning = false, inWindow, leaving = false, crate, head, dock, centre, children, onCrateAway, onPanels }: StageLayoutProps) {
  const principles = useLayoutPrinciples();
  const shown = panels.shown;
  const docks = useMemo(() => crateDocks({ w: width, h: height }, principles), [width, height, principles]);
  const mode: CrateMode = shown ? crateModeFor(docks, panels.crate) : 'hidden';
  const panel = useRef<HTMLDivElement | null>(null);
  useOverlayFocus(panel, mode);
  useDismiss(mode === 'overlay' && !warning, panel, onCrateAway);
  const showCentre = centre != null && (shown || warning);
  const docked = mode === 'docked';
  const spec = useMemo(() => stageSpec({ crate: docked ? 'docked' : 'none', panels: shown }), [docked, shown]);
  const crateCell = (m: CrateMode): ReactNode => (
    <div className="vs-stagelayout-crate-cell" data-mode={m} inert={warning || undefined}>
      <Layer level="base" as="nav" className="vs-stagelayout-crate" id={STAGE_CRATE_ID} aria-label={CRATE_LABEL}>
        <div className="vs-stagelayout-crate-panel" ref={panel} tabIndex={-1}>
          <div className="vs-stagelayout-band" data-tauri-drag-region />
          <div className="vs-stagelayout-crate-body">{crate}</div>
        </div>
      </Layer>
    </div>
  );
  return (
    <div className="vs-stagelayout" data-view="live" data-crate={mode} data-panels={shown ? 'shown' : 'hidden'} data-warning={warning ? '' : undefined} data-windowed={inWindow ? '' : undefined}>
      <Opaque className="vs-stagelayout-opaque">
        {/* The picture: the whole window under every part, whatever shows over it. */}
        {warning ? <div className="vs-stagelayout-dark" aria-hidden="true" /> : <Preview className="vs-stagelayout-picture" />}

        <Screen
          name="Stage"
          className="vs-stagelayout-screen"
          spec={spec}
          principles={principles}
          regions={{
            crate: docked ? crateCell('docked') : null,
            head: (
              <Stack direction="row" gap={2} align="center" className="vs-stagelayout-head" data-tauri-drag-region>
                {shown && head}
              </Stack>
            ),
            centre: showCentre ? (
              <div className="vs-stagelayout-centre" data-for={warning ? 'warning' : 'offer'}>
                {centre}
              </div>
            ) : null,
            dock: (
              <div className="vs-stagelayout-dock-cell" inert={warning || undefined}>
                <Region name={DOCK_LABEL} className="vs-stagelayout-dock">
                  {dock}
                </Region>
              </div>
            ),
            peek: (
              <div className="vs-stagelayout-peek">
                <Layer level="top" className="vs-stagelayout-hint-face">
                  <Text as="button" size="caption" type="button" className="vs-stagelayout-hint" aria-label={PANELS_HINT_LABEL} onClick={onPanels}>
                    <Text as="kbd" size="inherit" weight="strong" tabular className="vs-stagelayout-hint-key">
                      \
                    </Text>{' '}
                    {PANELS_HINT}
                  </Text>
                </Layer>
              </div>
            ),
          }}
        />

        {/* Laid over (a window too narrow to dock it): over everything at the window's left edge, taking no room. */}
        {mode === 'overlay' && crateCell('overlay')}

        {children}

        {leaving && <Leaving />}
      </Opaque>
    </div>
  );
}
