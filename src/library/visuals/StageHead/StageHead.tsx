import { CameraAction } from '../Camera/Camera';
import { ButtonFace } from '../../components/core/ActionButton/ActionButton';
import type { ReactNode } from 'react';
import { useForm, type Forms, type Length } from '../../layout/assembly';
import { Surface } from '../../primitives/Surface';
import { Text } from '../../primitives/Text';
import { titleOf } from '../HelpOverlay/HelpOverlay';
import { Icon } from '../Icon/Icon';
import { LinkPanel } from '../LinkPanel/LinkPanel';
import type { LiveState } from '../model/live-model';
import type { FullScreenOfferProps, StageHeadProps } from '../model/stage-model';
import { useLinkFrame } from '../model/useLive';
import { OutputPanel } from '../OutputPanel/OutputPanel';
import { Popover } from '../Popover/Popover';
import { notice } from '../model/shell';
import { SourcePicker } from '../SourcePicker/SourcePicker';
import { BeatDot, beatLabel, bpmText, Fps, linked, openSettings, outputLabel, SkipNote, TapButton } from '../Status/Status';
import { ViewSwitch } from '../Views/Views';
import './StageHead.css';

export type StageHeadForm = 'full' | 'short';

/** The title bar's 52px. */
const TITLEBAR: Length = { space: [6, 4, 1] };

/** what the header's type needs, in the shell's header row */
export const STAGE_HEAD_FORMS: Forms<StageHeadForm> = [
  // full: the switch and the lights with their whole words — 808px, the original's 900px window less the 84px lights room and 8px right inset
  { id: 'full', min: { w: { unit: 202 }, h: TITLEBAR }, ideal: { w: { unit: 202 }, h: TITLEBAR }, grow: { w: true } },
  // short: the lights' words and the skipped note cut shorter, so the row keeps to one line
  { id: 'short', min: { w: { control: 10 }, h: TITLEBAR }, ideal: { w: { control: 10 }, h: TITLEBAR }, grow: { w: true } },
];

/** What ✕ is called, and its tooltip: it leaves at once, as ⌘⇧L does; Esc held does too. */
export const LEAVE_LABEL = 'Leave live';
export const LEAVE_TITLE = 'Leave live (⌘⇧L, hold Esc)';

/** What the Output light shows beside its glyph: the display the picture is on, or "In this window" while it is on none. */
export const outputWords = (live: Pick<LiveState, 'status'>): string => live.status.display?.name ?? 'In this window';

/** The header's props: Home | Live, the lights, ?, settings and ✕ (the crate's toggle is gone with the crate). */
export type StageHeadOwnProps = Omit<StageHeadProps, 'crateOpen' | 'onCrate'> & {
  /** ✕: leave live at once. */
  onLeave(): void;
  form?: StageHeadForm;
};

/** Figures in a light's label: tabular, at the label's size (StageHead.css matches its weight). */
function LightNum({ className, children, ...rest }: { className: string; children: ReactNode; 'aria-hidden'?: 'true' }) {
  return (
    <Text size="inherit" tabular className={`vs-stagehead-num ${className}`} {...rest}>
      {children}
    </Text>
  );
}

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
          <LightNum className="vs-num">{bpm ?? '— BPM'}</LightNum>
          {peers !== null && (
            <LightNum className="vs-stagehead-light-sub vs-num" aria-hidden="true">
              <Icon name="link" size={12} />
              {peers}
            </LightNum>
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

/** The Output light: where the picture goes, as words, white while it is on a display and grey while in this window; its popover picks the display and says how it fits. */
function OutputLight({ live }: { live: LiveState }) {
  return (
    <Popover
      className="vs-stagehead-light vs-stagehead-output"
      name={outputLabel(live.status)}
      title={titleOf('output')}
      align="right"
      label={
        <span className="vs-stagehead-light-text" data-on={live.status.display ? '' : undefined}>
          {outputWords(live)}
        </span>
      }
    >
      <div className="vs-stagehead-pop" data-pop="output">
        <OutputPanel status={live.status} show={live.show} />
      </div>
    </Popover>
  );
}

/**
 * **Job.** The Stage's header: one row of bare type on the window buttons' line, 8px in from
 * the window's edge. On the left Home | Live, as Home's header switches them; on the right the
 * skipped note and a slow frame rate when there are any, the audio input (its mixer glyph and
 * level, moved up from the controls over the picture), the Beat and Output lights as words
 * (Home's popovers, not modal: live's keys keep working while one is open), then the camera, ?
 * and settings as quiet glyphs and a quiet ✕ that leaves live. The empty line between them is
 * the title bar: a drag there moves the window. It shows and fades with the controls (the
 * shell's one overlay, StageLayout).
 *
 * **Changed.** No capsules and no crate toggle: type and glyphs on the shell's scrim, the
 * popovers' panels the only solid layers (opaque over the native picture in the Stage's scope).
 * The Output light is its words alone, white on a display and grey in this window. ✕ is new:
 * "Leave live (⌘⇧L, hold Esc)". The narrow window's shorter words are a form
 * (`STAGE_HEAD_FORMS`: full → short) the assembled screen picks, or the `form` prop.
 *
 * **Kept.** Every name, label, tooltip and key shortcut of the lights, ? and settings; the drag
 * region; how far the words shorten when narrow.
 */
export function StageHead({ live, help, onHelp, onView, onLeave, form }: StageHeadOwnProps) {
  const f = useForm(STAGE_HEAD_FORMS, form);
  return (
    <Text as="header" className="vs-stagehead" data-form={f} data-tauri-drag-region>
      <span className="vs-stagehead-switch">
        <ViewSwitch view="live" onChange={onView} />
      </span>
      <span className="vs-stagehead-fill" />
      <SkipNote className="vs-stagehead-skipped" />
      <Fps className="vs-stagehead-fps" />
      <span className="vs-stagehead-audio">
        <SourcePicker onError={(e) => live.setError(notice("Couldn't use that audio input.", e))} channels="none" width={180} />
      </span>
      <BeatLight live={live} />
      <OutputLight live={live} />
      <span className="vs-stagehead-tools">
        <CameraAction className="vs-stagehead-tool" />
        <ButtonFace tone="quiet" className="vs-stagehead-tool" aria-label="Help" aria-haspopup="dialog" aria-expanded={help} aria-keyshortcuts="?" title={titleOf('help')} onClick={onHelp}>
          <Icon name="help" />
        </ButtonFace>
        <ButtonFace tone="quiet" className="vs-stagehead-tool" aria-label="Settings" aria-haspopup="dialog" aria-keyshortcuts="Meta+," title={`${titleOf('settings')} (⌘,)`} onClick={openSettings}>
          <Icon name="gear" />
        </ButtonFace>
        <ButtonFace tone="quiet" className="vs-stagehead-tool vs-stagehead-leave" aria-label={LEAVE_LABEL} aria-keyshortcuts="Meta+Shift+L" title={LEAVE_TITLE} onClick={onLeave}>
          <Icon name="close" />
        </ButtonFace>
      </span>
    </Text>
  );
}
StageHead.forms = STAGE_HEAD_FORMS;

/**
 * **Job.** "Go full screen on…", a corner toast while the picture plays in the window (as it does
 * on the way in: live never opens the output by itself): a button for each display, and with only
 * one the note that the picture will cover this window. Nothing while the output is on a display,
 * or before the displays are known. The shell stacks it at the window's bottom right.
 *
 * **Changed.** It was over the picture's middle; it is now Home's toast: a float `Surface` (opaque
 * in the Stage's scope, taking the picture's light from the right), in caption type, each
 * display's button a quiet `ButtonFace`.
 *
 * **Kept.** The group's name and tooltip, the buttons' names and the note.
 */
export function FullScreenOffer({ live }: FullScreenOfferProps) {
  if (!live.inWindow || !live.displays?.length) return null;
  return (
    <Surface layer="float" radius="control" ambient="right" className="vs-stagehead-offer" role="group" aria-label="Go full screen" title={titleOf('fullscreen')}>
      <Text as="div" size="caption" leading="normal" className="vs-stagehead-offer-body">
        {live.displays.map((d) => (
          <ButtonFace key={d.id} tone="quiet" className="vs-stagehead-offer-go" onClick={() => live.show(d.id)} aria-label={`Go full screen on ${d.name}`}>
            <Icon name="fullscreen" size={14} />
            <span>
              Full screen on{' '}
              <Text as="b" size="inherit" weight="strong" leading="tight" className="vs-stagehead-offer-name">
                {d.name}
              </Text>
            </span>
          </ButtonFace>
        ))}
        {live.displays.length === 1 && (
          <Text as="p" size="caption" className="vs-stagehead-offer-note">
            One display: the picture will cover this window. ✕ or ⌘⇧L comes back.
          </Text>
        )}
      </Text>
    </Surface>
  );
}
