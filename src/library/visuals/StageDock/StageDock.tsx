import { useEffect, useRef, useState } from 'react';
import { ButtonFace } from '../../components/core/ActionButton/ActionButton';
import { Slider } from '../../components/core/Slider/Slider';
import { Group } from '../../layout/Group';
import { useForm, type Forms, type Length } from '../../layout/assembly';
import { Surface } from '../../primitives/Surface';
import { Text } from '../../primitives/Text';
import { titleOf, type ControlId } from '../HelpOverlay/HelpOverlay';
import { Icon, type IconName } from '../Icon/Icon';
import { range } from '../model/controls';
import * as fx from '../model/fx';
import { movesByItself, playsFrom, presetLength } from '../model/home';
import { openEffects, padLabel, type LiveState } from '../model/live-model';
import { nameOf, notice } from '../model/shell';
import type { StageDockProps } from '../model/stage-model';
import { SilenceBanner } from '../Onboarding/Onboarding';
import { TransportBar, type TransportBarProps } from '../TransportBar/TransportBar';
import { NoticeBanner } from '../Views/Views';
import './StageDock.css';

export type StageDockForm = 'full' | 'stacked';

/** The controls over the picture under the header: the preset's two lines, the keys' row and the effects' row (150px at the least). */
const H_ONE: Length = { control: 5 };
/** The effects' row wrapped once (another 30px). */
const H_TWO: Length = { control: 6 };

/** what the controls over the picture need (no outer insets: StageLayout adds those) */
export const STAGE_DOCK_FORMS: Forms<StageDockForm> = [
  // full: the effects, Intensity and More effects… on one row under the transport's keys — 700px
  { id: 'full', min: { w: { unit: 175 }, h: H_ONE }, ideal: { w: { unit: 175 }, h: H_ONE }, grow: { w: true, h: true } },
  // stacked: the effect keys on one row, Intensity and More effects… on the next
  { id: 'stacked', min: { w: { control: 10 }, h: H_TWO }, ideal: { w: { control: 10 }, h: H_TWO }, grow: { w: true, h: true } },
];

/** Intensity's range: 0–1, a double-click back to the middle (1× sensitivity), as Live's slider had it. */
const INTENSITY = range('intensity', 0, 1, 0.5);

/** Seconds on the preset playing, ticking each second while one plays, from when it opened (`since`, ms; a re-open of the same preset restarts it); null while nothing plays. */
function useElapsed(current: string | null, since: number, length: number | null): TransportBarProps['position'] {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!current) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [current, since]);
  return current ? { elapsed: Math.max(0, (now - since) / 1000), length } : null;
}

/**
 * Home's floating transport driving the deck, with the props Home passes: the auto-change ring is
 * HOLD (H; its tooltip says whether and when it moves on), ◀ ▶ step, the dice random, the preset
 * playing and where from at the picture's top left, its star at the top right, the audio input.
 */
function useTransport(live: LiveState): TransportBarProps {
  const deck = live.deck;
  const position = useElapsed(live.current, live.since, deck ? presetLength({ ...deck, hold: live.held }) : null);
  const name = live.current ? nameOf(live.current) : null;
  return {
    layout: 'overlay',
    playing: !live.held,
    onPlayPause: () => live.actFx({ kind: 'hold', on: null }),
    onStep: (by) => live.act({ kind: by === -1 ? 'previous' : by === 1 ? 'next' : 'random' }),
    stepIn: deck?.playlist ? ' in the playlist' : '',
    position,
    moves: deck ? movesByItself(deck) : false,
    onAudioError: (e) => live.setError(notice("Couldn't use that audio input.", e)),
    now: name ? { name, from: deck && live.lists ? playsFrom(deck, live.lists.playlists) : undefined } : null,
    star: live.current && live.key ? { on: live.star, onToggle: live.favourite } : null,
  };
}

/**
 * **Job.** One effect key: its glyph and its name, as one quiet button (its key letter in the
 * tooltip and its accessible name, the help list's). `on` makes it a toggle (`aria-pressed`), the
 * name white and the glyph in the accent while on. With `hold` it is a held effect: on while the
 * pointer is down, off when it comes up or leaves; Shift-click latches; from the keyboard (Enter or
 * Space) it toggles.
 *
 * **Changed.** No key letter under the name (the tooltip has it); no key until pointed at.
 *
 * **Kept.** Its props, the hold gesture, the names and tooltips.
 */
export function EffectKey({
  id,
  glyph,
  name,
  on,
  onPress,
  hold,
}: {
  id: ControlId;
  glyph: IconName;
  name: string;
  on: boolean;
  onPress?(): void;
  hold?: { kind: fx.Hit; send(action: fx.FxAction): void };
}) {
  const pressed = useRef(false);
  const release = () => {
    if (!hold || !pressed.current) return;
    pressed.current = false;
    hold.send(fx.hitAction(hold.kind, false));
  };
  return (
    <ButtonFace
      tone="quiet"
      className="vs-stagedock-key"
      data-pad={id}
      aria-pressed={on}
      aria-label={padLabel(id, name)}
      title={titleOf(id)}
      onClick={hold ? undefined : onPress}
      onPointerDown={
        hold
          ? (e) => {
              if (e.button !== 0) return;
              if (e.shiftKey) return hold.send(fx.hitAction(hold.kind, null));
              pressed.current = true;
              e.currentTarget.setPointerCapture?.(e.pointerId);
              hold.send(fx.hitAction(hold.kind, true));
            }
          : undefined
      }
      onPointerUp={hold ? release : undefined}
      onPointerCancel={hold ? release : undefined}
      onLostPointerCapture={hold ? release : undefined}
      onKeyDown={
        hold
          ? (e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              e.stopPropagation();
              if (!e.repeat) hold.send(fx.hitAction(hold.kind, null));
            }
          : undefined
      }
    >
      <Icon name={glyph} />
      <Text size="label" leading="tight" className="vs-stagedock-key-name">
        {name}
      </Text>
    </ButtonFace>
  );
}

/**
 * **Job.** Live's controls over the picture (see `StageDockProps`), under the header: Home's
 * floating transport (`TransportBar layout="overlay"`: the preset and where it plays from at the
 * top left, the dice and its star at the top right, ◀ the auto-change ring ▶ dead centre at the
 * foot; the audio input is in the header, StageHead), and under its keys a second line: Strobe, Blackout and Freeze (strobe and freeze held,
 * blackout a toggle), Intensity as an Apple slider row and More effects…. The shell places it and
 * fades it in with the header (StageLayout); this paints nothing.
 *
 * **Changed.** No dock bar: it floats over the picture on the shell's scrim. HOLD is the ring (its
 * tooltip says whether and when it moves on), so the Hold pill, the Next line, its "in N beats"
 * and the rating chips are gone. Intensity is the core `Slider` (`layout="row"`: its gestures and
 * keys); More effects… is the mixer glyph. The forms are `full` (one effects row) and `stacked`
 * (two), from the room the shell gives it (`STAGE_DOCK_FORMS`), or the `form` prop.
 *
 * **Kept.** The props, `EffectKey`, the effects' names, tooltips and keys.
 */
export function StageDock({ live, form }: StageDockProps & { form?: StageDockForm }) {
  const f = useForm(STAGE_DOCK_FORMS, form);
  const transport = useTransport(live);
  const e = live.effects;
  const pct = Math.round(live.intensity * 100);
  return (
    <div className="vs-stagedock" data-form={f}>
      <TransportBar {...transport} />
      <div className="vs-stagedock-row">
        <Group className="vs-stagedock-keys" name="Effects" label={false} gap={1}>
          <EffectKey id="strobe" glyph="strobe" name="Strobe" on={e?.strobe === true} hold={{ kind: 'strobe', send: live.actFx }} />
          <EffectKey id="blackout" glyph="blackout" name="Blackout" on={e?.blackout === true} onPress={() => live.actFx({ kind: 'blackout', on: null })} />
          <EffectKey id="freeze" glyph="freeze" name="Freeze" on={e?.freeze === true} hold={{ kind: 'freeze', send: live.actFx }} />
        </Group>
        <Slider
          param={INTENSITY}
          value={live.intensity}
          onChange={live.setIntensity}
          display={`${pct}%`}
          layout="row"
          length="auto"
          fill
          origin="min"
          name="Intensity"
          label="Intensity"
          title={titleOf('intensity')}
          className="vs-stagedock-intensity"
        />
        <ButtonFace tone="quiet" className="vs-stagedock-more" onClick={openEffects} title={titleOf('more')}>
          <Icon name="mixer" size={14} />
          <Text size="label" leading="tight">
            More effects…
          </Text>
        </ButtonFace>
      </div>
    </div>
  );
}
StageDock.forms = STAGE_DOCK_FORMS;

/**
 * **Job.** Live's notices as corner toasts (the shell stacks them at the window's bottom right, as
 * Home's toast): the silence banner when the music stops, a failure (`live.error`, with its
 * dismiss) and a quiet state line (`live.hint`, polite, no dismiss). Nothing when there is none.
 *
 * **Changed.** They were over the dock's middle; each is now Home's toast: a float `Surface`
 * (opaque in the Stage's scope) taking the picture's light from the right, in caption type.
 *
 * **Kept.** The banners, their roles and copy.
 */
export function StageNotices({ live }: { live: LiveState }) {
  return (
    <>
      <SilenceBanner />
      {live.error && (
        <Surface layer="float" radius="control" ambient="right" className="vs-stagedock-toast">
          <Text as="div" size="caption" leading="normal" className="vs-stagedock-toast-type">
            <NoticeBanner className="vs-stagedock-notice" notice={live.error} onDismiss={live.dismiss} />
          </Text>
        </Surface>
      )}
      {/* A state, not a failure (Hold keeping the preset, leaving asking for a second press): quiet, polite, no dismiss. */}
      {live.hint && (
        <Surface layer="float" radius="control" ambient="right" className="vs-stagedock-toast">
          <Text as="p" size="caption" leading="normal" className="vs-stagedock-hint" ariaRole="status">
            {live.hint}
          </Text>
        </Surface>
      )}
    </>
  );
}
