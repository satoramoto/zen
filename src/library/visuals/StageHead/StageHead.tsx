import { ButtonFace } from '../../components/core/ActionButton/ActionButton';
import { Layer } from '../../layout/Layer';
import { titleOf } from '../HelpOverlay/HelpOverlay';
import { Icon } from '../Icon/Icon';
import { LinkPanel } from '../LinkPanel/LinkPanel';
import type { LiveState } from '../model/live-model';
import { STAGE_CRATE_ID, type FullScreenOfferProps, type StageHeadProps } from '../model/stage-model';
import { useLinkFrame } from '../model/useLive';
import { say } from '../model/words';
import { OutputPanel } from '../OutputPanel/OutputPanel';
import { Popover } from '../Popover/Popover';
import { BeatDot, beatLabel, bpmText, Fps, linked, openSettings, outputLabel, SkipNote, TapButton } from '../Status/Status';
import { ViewSwitch } from '../Views/Views';
import './StageHead.css';

/** The crate's toggle's tooltip: what it does now, show or hide. */
export const crateTitle = (open: boolean): string => `${open ? 'Hide' : 'Show'} the ${say('crate')}`;

/** What the Output light shows beside its glyph: the display the picture is on, or "In this window" (in the header's normal ink) while it is on none. */
export const outputWords = (live: Pick<LiveState, 'status'>): string => live.status.display?.name ?? 'In this window';

/**
 * The Beat light: the dot flashing on each beat, the tempo, and with a Link
 * session the peers keeping it; its popover is tap tempo and Ableton Link.
 * Its own leaf, as Link's frames come ten times a second.
 */
function BeatLight({ live }: { live: LiveState }) {
  const frame = useLinkFrame();
  const bpm = bpmText(frame, live.effects);
  const peers = linked(frame) ? frame.peers : null;
  return (
    <Popover
      className="vs-stagehead-light"
      name={beatLabel(frame, live.effects)}
      title={titleOf('beat')}
      align="right"
      label={
        <>
          <BeatDot frame={frame} className="vs-stagehead-beat-dot" />
          <span className="vs-num">{bpm ?? '— BPM'}</span>
          {peers !== null && (
            <span className="vs-stagehead-light-sub vs-num" aria-hidden="true">
              <Icon name="link" size={12} />
              {peers}
            </span>
          )}
        </>
      }
    >
      <div className="vs-stagehead-pop" data-pop="beat">
        <TapButton effects={live.effects} onTap={() => live.actFx({ kind: 'tap' })} />
        <LinkPanel />
      </div>
    </Popover>
  );
}

/** The Output light: where the picture goes, the display's name or "In this window" in the header's normal ink; its popover picks the display and says how it fits. */
function OutputLight({ live }: { live: LiveState }) {
  return (
    <Popover
      className="vs-stagehead-light"
      name={outputLabel(live.status)}
      title={titleOf('output')}
      align="right"
      label={
        <>
          <Icon name="output" size={14} />
          <span className="vs-stagehead-light-text">{outputWords(live)}</span>
        </>
      }
    >
      <div className="vs-stagehead-pop" data-pop="output">
        <OutputPanel status={live.status} show={live.show} />
      </div>
    </Popover>
  );
}

/**
 * **Job.** The Stage's header, on the traffic lights' line: two opaque capsules
 * over the picture, and between them the picture itself, which drags the window.
 * The leading one is the crate's toggle and Home | Live, as Home's header
 * switches them; the trailing one says when presets were skipped or the picture
 * runs slow, then the Beat and Output lights (Home's popovers, not modal: live's
 * keys keep working while one is open), ? and settings.
 *
 * **Changed.** Each capsule is a base `Layer` (the shell's `Opaque` makes it the
 * solid tone, no blur, over the picture); the glyph tools are core `ButtonFace`s
 * in the quiet tone; Home | Live is Views' `ViewSwitch` as the theme's tabs draw it
 * (no local overrides). The popovers' panels are the sibling `Popover`'s float
 * layers, opaque inside the Stage's scope, so the stylesheet no longer repaints
 * them, nor styles the Link and Output panels' or the tap key's insides (theirs).
 * The skipped note goes at once rather than fading (nothing animates).
 *
 * **Kept.** The props, every name, label, tooltip and key shortcut, the drag
 * region and the 36px capsules on the 52px title bar.
 *
 * **Tuning knobs** (StageHead.css):
 * - `--vs-stagehead-cap-h`: the capsules' 36px, centred on the window buttons' line (y 28).
 * - `--vs-stagehead-cap-radius`: their 12px corners.
 * - `--vs-stagehead-offer-radius`: the offer's 18px corners (the inset panels').
 */
export function StageHead({ live, crateOpen, onCrate, help, onHelp, onView }: StageHeadProps) {
  return (
    <header className="vs-stagehead" data-tauri-drag-region>
      <Layer level="base" className="vs-stagehead-cap vs-stagehead-cap-lead">
        <ButtonFace tone="quiet" className="vs-stagehead-tool" aria-label={say('crate')} aria-controls={STAGE_CRATE_ID} aria-expanded={crateOpen} title={crateTitle(crateOpen)} onClick={onCrate}>
          <Icon name="sidebar" />
        </ButtonFace>
        <span className="vs-stagehead-switch">
          <ViewSwitch view="live" onChange={onView} />
        </span>
      </Layer>
      <span className="vs-stagehead-fill" />
      <Layer level="base" className="vs-stagehead-cap vs-stagehead-cap-trail">
        <SkipNote className="vs-stagehead-skipped" />
        <Fps className="vs-stagehead-fps" />
        <BeatLight live={live} />
        <OutputLight live={live} />
        <ButtonFace tone="quiet" className="vs-stagehead-tool" aria-label="Help" aria-haspopup="dialog" aria-expanded={help} aria-keyshortcuts="?" title={titleOf('help')} onClick={onHelp}>
          <Icon name="help" />
        </ButtonFace>
        <ButtonFace tone="quiet" className="vs-stagehead-tool" aria-label="Settings" aria-haspopup="dialog" aria-keyshortcuts="Meta+," title={`${titleOf('settings')} (⌘,)`} onClick={openSettings}>
          <Icon name="gear" />
        </ButtonFace>
      </Layer>
    </header>
  );
}

/**
 * **Job.** "Go full screen on…", over the picture while it plays in the window
 * (as it does on the way in: live never opens the output by itself): a button
 * for each display, and with only one the note that the picture will cover this
 * window. Nothing while the output is on a display, or before the displays are
 * known.
 *
 * **Changed.** The capsule is a base `Layer` (opaque inside the Stage's scope);
 * each display's button a core `ButtonFace` in the key material.
 *
 * **Kept.** The group's name and tooltip, the buttons' names and the note.
 */
export function FullScreenOffer({ live }: FullScreenOfferProps) {
  if (!live.inWindow || !live.displays?.length) return null;
  return (
    <div className="vs-stagehead-offer" role="group" aria-label="Go full screen" title={titleOf('fullscreen')}>
      <Layer level="base" className="vs-stagehead-offer-face">
        {live.displays.map((d) => (
          <ButtonFace key={d.id} className="vs-stagehead-offer-go" onClick={() => live.show(d.id)} aria-label={`Go full screen on ${d.name}`}>
            <Icon name="fullscreen" />
            <span>
              Full screen on <b>{d.name}</b>
            </span>
          </ButtonFace>
        ))}
        {live.displays.length === 1 && <p className="vs-stagehead-offer-note">One display: the picture will cover this window. ✕ or ⌘⇧L comes back.</p>}
      </Layer>
    </div>
  );
}
