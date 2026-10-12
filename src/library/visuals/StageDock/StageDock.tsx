import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ButtonFace } from '../../components/core/ActionButton/ActionButton';
import { useParamGesture } from '../../components/core/Param/useParamGesture';
import { Group } from '../../layout/Group';
import { Layer } from '../../layout/Layer';
import { Text } from '../../primitives/Text';
import { padKey, titleOf, type ControlId } from '../HelpOverlay/HelpOverlay';
import { Icon, type IconName } from '../Icon/Icon';
import { range } from '../model/controls';
import * as fx from '../model/fx';
import { playsFrom, presetLength } from '../model/home';
import { nextName, nextWhenText, openEffects, padLabel, saysWhere, starsText, whereSr, whereText, type LiveState } from '../model/live-model';
import { nameOf, notice } from '../model/shell';
import type { StageDockProps } from '../model/stage-model';
import { useLinkFrame } from '../model/useLive';
import { say, Say } from '../model/words';
import { SilenceBanner } from '../Onboarding/Onboarding';
import { TransportBar, type TransportBarProps } from '../TransportBar/TransportBar';
import { NoticeBanner } from '../Views/Views';
import './StageDock.css';

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
 * Home's transport bar driving the deck: pause is HOLD (the preset stays, as
 * the H key and today's Hold pad have it), ◀ ▶ step, R random, the preset
 * playing and where from, the time on it, the audio input.
 */
function useTransport(live: LiveState): TransportBarProps {
  const deck = live.deck;
  const position = useElapsed(live.current, live.since, deck ? presetLength({ ...deck, hold: live.held }) : null);
  const name = live.current ? nameOf(live.current) : null;
  return {
    playing: !live.held,
    onPlayPause: () => live.actFx({ kind: 'hold', on: null }),
    onStep: (by) => live.act({ kind: by === -1 ? 'previous' : by === 1 ? 'next' : 'random' }),
    stepIn: deck?.playlist ? ' in the playlist' : '',
    position,
    onAudioError: (e) => live.setError(notice("Couldn't use that audio input.", e)),
    now: name ? { name, from: deck && live.lists ? playsFrom(deck, live.lists.playlists) : undefined } : null,
  };
}

/** When the next preset comes: its own leaf, as Link's frames come ten times a second. */
function NextWhen({ deck }: { deck: LiveState['deck'] }) {
  const when = nextWhenText(useLinkFrame(), deck, Date.now());
  // Set apart from the name by a dot (and a comma for screen readers), and named in its tooltip: "every 30 s" is when it changes.
  return when ? (
    <Text as="em" role="caption" leading="normal" tabular className="vs-stagedock-when" title={`When the next preset comes: ${when}`}>
      <span className="vs-stagedock-sr">, changes </span>
      {when}
    </Text>
  ) : null;
}

/** The deck's Next line, with HOLD, the favourite's star and the rating before it: what the transport's now line doesn't say. */
function NextLine({ live }: { live: LiveState }) {
  const next = nextName(live.says);
  const says = live.says;
  const item = says.kind === 'item' || says.kind === 'filter' ? says.item : null;
  return (
    <div className="vs-stagedock-next">
      {live.held && (
        <Text
          weight="strong"
          leading="normal"
          className="vs-stagedock-held"
          title={`${Say('hold')}: this preset stays — ${say('auto-advance')} and Link's changes wait until you let go (H)`}
        >
          Hold
        </Text>
      )}
      {live.star && (
        <span className="vs-stagedock-star" title="A favourite (L takes the star off)" role="img" aria-label="favourite">
          <Icon name="star" size={12} />
        </span>
      )}
      {live.rating !== null && (
        <Text
          leading="normal"
          className="vs-stagedock-rating"
          title={`Rated ${live.rating} of 5 (press ${live.rating} again to take it off)`}
          ariaRole="img"
          aria-label={`rated ${live.rating} of 5`}
        >
          {starsText(live.rating)}
        </Text>
      )}
      <Text as="p" leading="normal" className="vs-stagedock-next-line" title={`${titleOf('next')}. ${whereText(live.up, live.deck)}`}>
        <Text weight="strong" leading="normal" className="vs-stagedock-next-label">
          Next
        </Text>
        <span className="vs-stagedock-sr">: </span>
        {item ? (
          <span className="vs-stagedock-next-name" data-missing={item.missing ? '' : undefined} title={item.missing ? `Not in the library any more: ${item.path}` : item.path}>
            {item.missing ? <s>{item.name}</s> : item.name}
            {item.missing && <span className="vs-stagedock-sr"> — missing from the library, it won't open</span>}
          </span>
        ) : (
          <span className="vs-stagedock-quiet">{next.text}</span>
        )}
        {saysWhere(says, live.up, live.deck) && <span className="vs-stagedock-sr">{whereSr(live.up, live.deck)}</span>}
        {says.kind !== 'held' && live.deck && <NextWhen deck={live.deck} />}
      </Text>
    </div>
  );
}

/**
 * **Job.** One effect key: a glyph, its name and its key letter, as one button
 * (the name and letter quiet, its accessible name the help list's with its
 * keys). `on` makes it a toggle (`aria-pressed`). With `hold` it is a held
 * effect: on while the pointer is down, off when it comes up or leaves;
 * Shift-click latches; from the keyboard (Enter or Space) it toggles.
 *
 * **Changed.** The face is the core `ButtonFace` in the quiet tone: no key until
 * pointed at, pressed in and lit in the accent while on.
 *
 * **Kept.** Its props, the hold gesture, the names, tooltips and key letters.
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
  const key = padKey(id);
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
      {key && (
        <Text as="small" size="label" leading="tight" className="vs-stagedock-key-letter" aria-hidden="true">
          {key}
        </Text>
      )}
    </ButtonFace>
  );
}

/**
 * Intensity: one fader (sensitivity, brightness and strobe level together),
 * the transport's thin track. The core gesture, as Live's slider had it: grab
 * and drag (a modifier for fine), arrows, Page Up/Down, Home and End (the
 * arrows aren't also a preset step), a double-click back to the middle.
 */
function IntensityFader({ live }: { live: LiveState }) {
  const pct = Math.round(live.intensity * 100);
  const gesture = useParamGesture({
    param: INTENSITY,
    value: live.intensity,
    onChange: live.setIntensity,
    axis: 'horizontal',
    anchor: 'pointer',
    travel: 'element',
    label: 'Intensity',
    display: `${pct}%`,
  });
  return (
    <Text
      as="div"
      leading="normal"
      className="vs-stagedock-fader"
      title={titleOf('intensity')}
      style={{ '--vs-stagedock-fill': `${gesture.fraction * 100}%` } as CSSProperties}
    >
      <span className="vs-stagedock-fader-name" aria-hidden="true">
        Intensity
      </span>
      <div className="vs-stagedock-fader-track" {...gesture.props}>
        <span className="vs-stagedock-fader-thumb" aria-hidden="true" />
      </div>
      <Text role="caption" leading="normal" tabular className="vs-stagedock-fader-value vs-num" aria-hidden="true">
        {pct}%
      </Text>
    </Text>
  );
}

/**
 * **Job.** The Stage's dock along the bottom (see `StageDockProps`): Home's
 * transport bar (pause is HOLD, ◀ ▶ step, R random, the time on the preset, the
 * audio input, a warning only while the picture draws slowly) and a row under
 * it: the Next line (with HOLD, the star and the rating), the effect keys
 * (strobe and freeze held, blackout a toggle), Intensity and More effects…. The
 * notice, and the silence banner when the music stops, show over them. The
 * shell places it and paints its panel (the "Live controls" region); the dock is
 * its contents.
 *
 * **Changed.** The effect keys are a layout `Group` (named "Effects", no visible
 * label) of core `ButtonFace`s; More effects… a quiet `ButtonFace`; Intensity runs
 * on the core `useParamGesture` (the widgets' gesture). The notice and the hint
 * float above the dock as `top` layers (toasts), opaque in the Stage's scope; the
 * silence banner is the sibling's own. Sizes are the scale's.
 *
 * **Kept.** The props, `EffectKey`, every name, tooltip and screen-reader line,
 * the narrow-dock steps (container queries at 940 and 700 px).
 *
 * **Tuning knobs** (StageDock.css):
 * - `--vs-stagedock-on`: the soft accent wash of the Hold pill.
 * - `--vs-stagedock-fill`: Intensity's position along its track, set inline from the gesture.
 */
export function StageDock({ live }: StageDockProps) {
  const transport = useTransport(live);
  const e = live.effects;
  return (
    <div className="vs-stagedock">
      <div className="vs-stagedock-banners">
        <SilenceBanner />
        {live.error && (
          <Layer level="top" as={Text} className="vs-stagedock-banner">
            <NoticeBanner className="vs-stagedock-notice" notice={live.error} onDismiss={live.dismiss} />
          </Layer>
        )}
        {/* A state, not a failure (Hold keeping the preset, leaving asking for a second press): quiet, polite, no dismiss. */}
        <Layer level="top" className="vs-stagedock-hint-face" data-hidden={live.hint ? undefined : ''}>
          <Text as="p" role="caption" leading="normal" className="vs-stagedock-hint" ariaRole="status" hidden={!live.hint}>
            {live.hint}
          </Text>
        </Layer>
      </div>
      <TransportBar {...transport} />
      <div className="vs-stagedock-row">
        <NextLine live={live} />
        <div className="vs-stagedock-fx">
          <Group className="vs-stagedock-keys" name="Effects" label={false} gap={1}>
            <EffectKey id="strobe" glyph="strobe" name="Strobe" on={e?.strobe === true} hold={{ kind: 'strobe', send: live.actFx }} />
            <EffectKey id="blackout" glyph="blackout" name="Blackout" on={e?.blackout === true} onPress={() => live.actFx({ kind: 'blackout', on: null })} />
            <EffectKey id="freeze" glyph="freeze" name="Freeze" on={e?.freeze === true} hold={{ kind: 'freeze', send: live.actFx }} />
          </Group>
          <IntensityFader live={live} />
          <ButtonFace tone="quiet" className="vs-stagedock-more" onClick={openEffects} title={titleOf('more')}>
            <Icon name="effects" size={14} />
            <Text size="label" leading="tight">
              More effects…
            </Text>
          </ButtonFace>
        </div>
      </div>
    </div>
  );
}
