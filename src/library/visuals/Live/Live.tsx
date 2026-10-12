import { useCallback, useEffect, useMemo, useState } from 'react';
import { HelpOverlay } from '../HelpOverlay/HelpOverlay';
import { remember, rememberedChoice } from '../model/home';
import { useTauriEvent } from '../model/hooks';
import { useLiveKeys } from '../model/liveKeys';
import * as output from '../model/output';
import { CRATE_KEY, crateModeFor, escapeDoes, panelsAtStart, toggleCrate, togglePanels, type Panels } from '../model/stage-model';
import { useLive } from '../model/useLive';
import { StageCrate } from '../StageCrate/StageCrate';
import { StageDock } from '../StageDock/StageDock';
import { FullScreenOffer, StageHead } from '../StageHead/StageHead';
import { crateDocks, StageLayout } from '../StageLayout/StageLayout';
import { useLayoutPrinciples } from '../HomeLayout/HomeLayout';
import { HOME, type View } from '../Views/Views';
import './Live.css';

// Live mode's reckonings moved to model/live-model.ts (the Stage contract); they are still here for what imported them from Live.
export { intensityOf, keyOf, openEffects, opensOnStart, padLabel, ratingOf, sendIntensity, starred, starsText, whenText, whereSr, whereText, type IntensityAction } from '../model/live-model';

/** The window's size, followed as it is resized: the room the Stage assembles in. */
function useWindowRoom(): { w: number; h: number } {
  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [room, setRoom] = useState(read);
  useEffect(() => {
    const resize = () => setRoom((r) => (r.w === window.innerWidth && r.h === window.innerHeight ? r : read()));
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return room;
}

/**
 * **Job.** Live mode, as the Stage: the picture full-bleed across the main
 * window, and Home's opaque inset panels over it — the header's two capsules
 * along the top (`StageHead`), the crate down the left (`StageCrate`), the dock
 * along the bottom (`StageDock`), all laid out by `StageLayout` and fed from
 * `useLive`. Going live plays in this window; "Go full screen on…" sits over the
 * picture's middle until the user puts the picture on a display (it, or the
 * Output popover).
 *
 * The crate docks where its needs fit beside the picture's open middle (the
 * assembled Stage's `crateDocks`: from 1100 px) and is laid over the rest elsewhere,
 * where it starts put away; the viewer's choice is kept (`CRATE_KEY`) where it
 * docks, as Home keeps its sidebar's. `\` hides every panel, leaving only the
 * picture, and shows them again. Esc pressed shows hidden panels, or puts a
 * laid-over crate away; held for 3 s (`LEAVE_HOLD_MS`) it leaves live, here or
 * on the output (which tells the page of Esc down and up, `output.onEscape`),
 * the Stage showing the hold's progress in this window and never on the output.
 * ✕ and ⌘⇧L leave at once, as they are deliberate. Leaving puts the effects back
 * (`useLive`'s unmount), so nothing is left inverted or frozen. With the
 * flashing warning owed, `App` doesn't mount live at all until it is understood.
 *
 * **Changed.** Nothing in the wiring; the parts it composes are rebuilt on the
 * library (a `Screen` over the preview `Hole`, everything over it `Opaque`).
 * The root's class is `vs-live`.
 *
 * **Kept.** The props, the re-exports, the keys, the crate's remembered choice,
 * the root's `data-windowed`, `data-panels` and `data-crate`.
 */
export function Live({
  start,
  onMode,
  windowed,
}: {
  start: string | null;
  onMode: (mode: View, path: string | null) => void;
  /**
   * Live always plays in the window on the way in (true or unset, as from
   * Home or `live-windowed`); false only when the app was started in live
   * mode (`VISUALS_LIVE=1`, `VISUALS_VIEW=live`), which opens the output.
   */
  windowed?: boolean;
}) {
  const live = useLive({ start, windowed });
  const { current } = live;
  const [help, setHelp] = useState(false);
  const room = useWindowRoom();
  const principles = useLayoutPrinciples();
  const docks = useMemo(() => crateDocks(room, principles), [room, principles]);
  const [panels, setPanels] = useState<Panels>(() => panelsAtStart(docks ? rememberedChoice(CRATE_KEY) : null));
  const mode = crateModeFor(docks, panels.crate);

  // ✕ and ⌘⇧L leave at once; Esc leaves only held for LEAVE_HOLD_MS (liveKeys), with its progress shown while held.
  const [leaving, setLeaving] = useState(false);
  const leaveLive = useCallback(() => onMode(HOME, current), [onMode, current]);
  const onView = useCallback((next: View) => next !== 'live' && onMode(next, current), [onMode, current]);

  /** Show or put away the crate; kept for next time only where it docks (laid over the picture, it starts put away again). */
  const chooseCrate = useCallback(
    (next: Panels) => {
      if (docks && next.crate !== null) remember(CRATE_KEY, next.crate);
      setPanels(next);
    },
    [docks],
  );
  const onCrate = () => chooseCrate(toggleCrate(panels, docks));
  const crateAway = () => chooseCrate({ ...panels, crate: false });

  const escapes = useLiveKeys({
    editor: leaveLive,
    holding: setLeaving,
    act: live.act,
    fx: live.actFx,
    rate: live.rate,
    favourite: live.favourite,
    help: () => setHelp((h) => !h),
    panels: () => setPanels(togglePanels),
    escape: () => {
      if (escapeDoes(panels) === 'show') {
        setPanels((p) => ({ ...p, shown: true }));
        return true;
      }
      // A crate laid over the picture takes Esc before live does.
      if (mode === 'overlay') {
        crateAway();
        return true;
      }
      return false;
    },
  });
  // Esc on the output does what it does here: pressed, it shows hidden panels; held, it leaves (shown here, never on the output).
  useTauriEvent(output.onEscape, (says) => {
    if (says === 'up') return escapes.escapeUp();
    setPanels((p) => (p.shown ? p : { ...p, shown: true }));
    escapes.escapeDown();
  });

  const offer = live.inWindow && (live.displays?.length ?? 0) > 0;

  return (
    <div className="vs-live" data-windowed={live.inWindow ? '' : undefined} data-panels={panels.shown ? undefined : 'hidden'} data-crate={mode}>
      <StageLayout
        width={room.w}
        height={room.h}
        panels={panels}
        inWindow={live.inWindow}
        leaving={leaving}
        head={<StageHead live={live} crateOpen={mode !== 'hidden'} onCrate={onCrate} help={help} onHelp={() => setHelp(true)} onView={onView} />}
        crate={<StageCrate live={live} mode={mode} onAway={crateAway} />}
        dock={<StageDock live={live} />}
        centre={offer ? <FullScreenOffer live={live} /> : undefined}
        onCrateAway={crateAway}
        onPanels={() => setPanels((p) => ({ ...p, shown: true }))}
      >
        {/* Laid over everything: the ? overlay (the dock shows the silence banner and the notice). */}
        <HelpOverlay open={help} onClose={() => setHelp(false)} stage />
      </StageLayout>
    </div>
  );
}
