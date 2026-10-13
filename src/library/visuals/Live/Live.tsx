import { useCallback, useEffect, useState } from 'react';
import { HelpOverlay } from '../HelpOverlay/HelpOverlay';
import * as api from '../model/api';
import { useTauriEvent } from '../model/hooks';
import { useLiveKeys } from '../model/liveKeys';
import * as output from '../model/output';
import { useLive } from '../model/useLive';
import { StageDock, StageNotices } from '../StageDock/StageDock';
import { FullScreenOffer, StageHead } from '../StageHead/StageHead';
import { StageLayout } from '../StageLayout/StageLayout';
import { HOME, type View } from '../Views/Views';
import './Live.css';

// Live mode's reckonings moved to model/live-model.ts (the Stage contract); they are still here for what imported them from Live.
export { intensityOf, keyOf, openEffects, opensOnStart, padLabel, ratingOf, sendIntensity, starred, starsText, whenText, whereSr, whereText, type IntensityAction } from '../model/live-model';

/** The playing preset's thumbnail, from the library's index by its key: the light the Stage's surfaces take (Home's `ambient`). */
function useThumbnail(key: string | null): string | null {
  const [rows, setRows] = useState<api.LibraryRow[] | null>(null);
  useEffect(() => {
    let gone = false;
    api.libraryIndex().then(
      (r) => !gone && setRows(r),
      () => {},
    );
    return () => {
      gone = true;
    };
  }, []);
  if (!key || !rows) return null;
  return rows.find((r) => r.key === key)?.thumbnail ?? null;
}

/**
 * **Job.** Live mode, as the Stage: the picture full-bleed across the main window, and over it,
 * on hover, the header (`StageHead`: Home | Live, the Beat and Output lights, the camera, ?,
 * settings and ✕) and the controls (`StageDock`: Home's floating transport and the effects' row),
 * laid out and faded by `StageLayout` and fed from `useLive`. Going live plays in this window;
 * "Go full screen on…" is a corner toast until the user puts the picture on a display (it, or the
 * Output popover), as are the notices. The Stage takes the playing preset's light (its thumbnail),
 * as Home does.
 *
 * `\` pins the controls shown (hovered or not) and lets them go again. Esc held for 3 s
 * (`LEAVE_HOLD_MS`) leaves live, here or on the output (which tells the page of Esc down and up,
 * `output.onEscape`), the Stage showing the hold's progress in this window and never on the
 * output. ✕ and ⌘⇧L leave at once, as they are deliberate. Leaving puts the effects back
 * (`useLive`'s unmount), so nothing is left inverted or frozen. With the flashing warning owed,
 * `App` doesn't mount live at all until it is understood.
 *
 * **Changed.** No crate (no sidebar in Live: the owner's call), no dock bar and no capsules: the
 * Stage is Home's language, type and glyphs fading in over the picture. `\` pins rather than
 * hides; a short Esc does nothing (it showed hidden panels, and nothing hides now).
 *
 * **Kept.** The props, the re-exports, the keys, the root's `data-windowed`; the root's class is
 * `vs-live`, and it says `data-pinned` while `\` holds the controls shown.
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
  const [pinned, setPinned] = useState(false);
  const thumbnail = useThumbnail(live.key);

  // ✕ and ⌘⇧L leave at once; Esc leaves only held for LEAVE_HOLD_MS (liveKeys), with its progress shown while held.
  const [leaving, setLeaving] = useState(false);
  const leaveLive = useCallback(() => onMode(HOME, current), [onMode, current]);
  const onView = useCallback((next: View) => next !== 'live' && onMode(next, current), [onMode, current]);

  const escapes = useLiveKeys({
    editor: leaveLive,
    holding: setLeaving,
    act: live.act,
    fx: live.actFx,
    rate: live.rate,
    favourite: live.favourite,
    help: () => setHelp((h) => !h),
    panels: () => setPinned((p) => !p),
  });
  // Esc on the output does what it does here: held, it leaves (shown here, never on the output).
  useTauriEvent(output.onEscape, (says) => (says === 'up' ? escapes.escapeUp() : escapes.escapeDown()));

  return (
    <div className="vs-live" data-windowed={live.inWindow ? '' : undefined} data-pinned={pinned ? '' : undefined}>
      <StageLayout
        pinned={pinned}
        inWindow={live.inWindow}
        leaving={leaving}
        ambient={thumbnail}
        head={<StageHead live={live} help={help} onHelp={() => setHelp(true)} onView={onView} onLeave={leaveLive} />}
        dock={<StageDock live={live} />}
        toasts={
          <>
            <FullScreenOffer live={live} />
            <StageNotices live={live} />
          </>
        }
      >
        {/* Laid over everything: the ? overlay. */}
        <HelpOverlay open={help} onClose={() => setHelp(false)} stage />
      </StageLayout>
    </div>
  );
}
