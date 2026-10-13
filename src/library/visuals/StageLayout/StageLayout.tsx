import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { Layer, Opaque } from '../../layout/Layer';
import { Screen } from '../../layout/Screen';
import { lengthSum, type Form, type Forms, type Length, type RegionSpec, type ScreenSpec, type Units } from '../../layout/assembly';
import { Ambient, type AmbientSource } from '../../primitives/Ambient';
import { Surface } from '../../primitives/Surface';
import { Text } from '../../primitives/Text';
import { LEAVE_HOLD_MS } from '../model/liveKeys';
import type { StageLayoutProps } from '../model/stage-model';
import { Preview } from '../Views/Views';
import { useLayoutPrinciples } from '../HomeLayout/HomeLayout';
import { STAGE_DOCK_FORMS } from '../StageDock/StageDock';
import { STAGE_HEAD_FORMS } from '../StageHead/StageHead';
import './StageLayout.css';

/* ---------- the Stage's parts, declared (docs/assembly.md) ---------- */

/** The header's 8px inset from the window's right edge. */
const INSET: Units = { space: 2 };
/** The window buttons' room at the header's start, 84px: x 24, three 12px buttons 8px apart, and 8px after. */
export const LIGHTS: Units = { space: [5, 3, 3, 3, 2, 2, 2] };
/** The controls' room round them on the scrim: 20px either side, 12px under. */
const CONTROLS_W: Length = { space: [5, 5] };
const CONTROLS_H: Length = { space: 3 };

/** Forms with room added on each axis (the insets, the lights' room). */
function padded(forms: Forms, w: Length, h: Length): Forms {
  const add = (n: Form['min']) => ({ w: lengthSum(n.w, w), h: lengthSum(n.h, h) });
  return forms.map((f): Form => ({ ...f, min: add(f.min), ideal: add(f.ideal) })) as unknown as Forms;
}

/**
 * The Stage's screen: one column over the whole picture, the header's row on the window buttons'
 * line and under it the controls (`dock`: the transport filling the picture's middle, the effects'
 * row at its foot). The controls are `now`, the header `chrome`, so the header shortens its words
 * first. Every region is plateless: the shell paints only the scrim, over the picture.
 */
export function stageSpec(): ScreenSpec {
  const region = (id: string, forms: Forms, priority: RegionSpec['priority']): RegionSpec => ({ id, forms, priority, plate: false });
  const head = padded(STAGE_HEAD_FORMS, lengthSum(LIGHTS, INSET), 0);
  const dock = padded(STAGE_DOCK_FORMS, CONTROLS_W, CONTROLS_H);
  return { rows: [[{ id: 'column', rows: [[region('head', head, 'chrome')], [region('dock', dock, 'now')]] }]] };
}

/** What the controls over the picture are called to a screen reader. */
export const DOCK_LABEL = 'Live controls';

/** What the progress says while Esc is held to leave live. */
export const LEAVING_TEXT = 'Keep holding Esc to leave live';

/**
 * The shell's props: the contract's `StageLayoutProps` less the crate, the hidden panels and the
 * window's size (Live has no crate, nothing hides now, and the screen fills its box), plus the pin, the corner toasts and the ambient light.
 */
export type StageProps = Pick<StageLayoutProps, 'warning' | 'inWindow' | 'leaving' | 'head' | 'dock' | 'centre' | 'children'> & {
  /** `\`: the controls stay shown, hovered or not. */
  pinned?: boolean;
  /** The corner toasts, stacked at the window's bottom right: "Go full screen on…", notices, silence. */
  toasts?: ReactNode;
  /** The picture the toasts' and popovers' surfaces take their light from (the playing preset's thumbnail). */
  ambient?: AmbientSource;
};

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

/**
 * **Job.** Live's Stage: the picture full-bleed across the main window, and over it one overlay
 * that fades in and out as Home's preview controls do: the header (`head`) on the window buttons'
 * line and the controls (`dock`, "Live controls") under it, on a scrim from the window's tint at
 * the top and the foot. The overlay shows while the window is hovered, while focus is in it or one
 * of its popovers is open, while `pinned` (`\`), and always with no hover (touch). The corner
 * toasts (`toasts`) stack at the bottom right, over everything, shown whether the controls are or
 * not. With the warning owed the picture is dark (the preview isn't mounted), the controls inert
 * and dimmed, and `centre` (the warning) centred over the window. While Esc is held to leave live
 * (`leaving`), its progress shows over everything; the output never shows it. The whole Stage is
 * an `Ambient` lit by `ambient`, so the float surfaces over it take the picture's colours.
 *
 * **Changed.** No crate and no dock bar: the inset panels are gone, the header is bare type, and
 * the controls float on the scrim (Hero's look: its scrim and fade, the same knobs). Nothing hides
 * the controls any more, so `\` pins them shown; the peek hint is gone. "Go full screen on…" and
 * the notices left the picture's middle and the dock for the corner. The window is still an
 * assembled `Screen` (`stageSpec`, docs/assembly.md) over the picture: the header and the
 * controls take their forms from the room they are given. Everything sits in one `Opaque` scope,
 * so each layer over the picture draws its solid and no backdrop.
 *
 * **Kept.** The drag region, the warning's dark window, the Esc hold's progress, the copy.
 *
 * **Tuning knobs** (StageLayout.css), sizes the scale has no step for:
 * - `--vs-stagelayout-titlebar`: the title bar's 52px (layout.css `--lay-titlebar`).
 * - `--vs-stagelayout-lights`: the window buttons' room, 84px.
 * - `--vs-stagelayout-fade` (160ms, Hero's `--vs-hero-fade`): how long the overlay fades (none under reduced motion).
 * - `--vs-stagelayout-scrim` (85%, Hero's `--vs-hero-scrim`): how much of the window's tint the scrim starts with.
 * - `--vs-stagelayout-toast-lift`: how far the toasts sit above the window's foot, clear of the controls' rows.
 * - `--vs-stagelayout-z-*`: the parts' stacking over the picture.
 * - `--vs-stagelayout-hold`: Esc's hold (`LEAVE_HOLD_MS`), set inline on the progress.
 * - `--vs-hole-radius`: Views' `Preview` knob, set to 0 here (the picture is square; macOS rounds the window).
 */
export function StageLayout({ pinned = false, warning = false, inWindow, leaving = false, head, dock, centre, toasts, ambient, children }: StageProps) {
  const principles = useLayoutPrinciples();
  const spec = useMemo(() => stageSpec(), []);
  return (
    <Ambient
      source={ambient}
      className="vs-stagelayout"
      data-view="live"
      data-pinned={pinned ? '' : undefined}
      data-warning={warning ? '' : undefined}
      data-windowed={inWindow ? '' : undefined}
    >
      <Opaque className="vs-stagelayout-opaque">
        {/* The picture: the whole window under everything, whatever shows over it. */}
        {warning ? <div className="vs-stagelayout-dark" aria-hidden="true" /> : <Preview className="vs-stagelayout-picture" />}

        {/* The one overlay: the scrim, the header and the controls, fading together. */}
        <div className="vs-stagelayout-reveal" data-pinned={pinned ? '' : undefined}>
          <Surface radius="none" className="vs-stagelayout-scrim" aria-hidden="true" />
          <Screen
            name="Stage"
            className="vs-stagelayout-screen"
            spec={spec}
            principles={principles}
            regions={{
              head: (
                <div className="vs-stagelayout-head" data-tauri-drag-region>
                  {head}
                </div>
              ),
              dock: (
                <div className="vs-stagelayout-dock" role="region" aria-label={DOCK_LABEL} inert={warning || undefined}>
                  {dock}
                </div>
              ),
            }}
          />
        </div>

        {warning && centre != null && <div className="vs-stagelayout-centre">{centre}</div>}

        {toasts != null && <div className="vs-stagelayout-toasts">{toasts}</div>}

        {children}

        {leaving && <Leaving />}
      </Opaque>
    </Ambient>
  );
}
