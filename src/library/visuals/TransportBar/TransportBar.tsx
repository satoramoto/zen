import { Group } from '../../layout/Group';
import { Text } from '../../primitives/Text';
import { Numbers } from '../Numbers/Numbers';
import { SourcePicker } from '../SourcePicker/SourcePicker';
import { FrameRate } from '../Views/Views';
import { Icon } from '../Icon/Icon';
import './TransportBar.css';

/**
 * **Job.** The bar along the bottom of the home's main column (HomeLayout's `bar` slot): the
 * transport, the hero above being the picture alone. ◀ play/pause ▶ R on the left; in the middle
 * the preset playing and where it plays from (`now`), then the time on it and how long until the
 * next one (the time on it alone once that has run out); the audio input on the right, and
 * before it a warning only while the picture draws slowly (`FrameRate slowOnly`).
 *
 * **Changed.** The keys are a library `Group` (unlabelled: the bar names them). Sizes and tones
 * read the contract (the track is the raised layer's tint, the time in the readout face with
 * tabular figures); the side padding is the main column's `--mat-plate-inset`. The audio input
 * is the library port of `SourcePicker`, quiet type at the bar's end.
 *
 * **Tuning knobs** (TransportBar.css):
 * - `--vs-transport-h` (64px): the bar's height.
 * - `--vs-transport-small`: the time's and the hint's type, a pixel under the caption.
 * - `--vs-transport-track-radius` (2px): the track's and its fill's corners.
 *
 * **Kept.** Props, `clock`, `timeHint`, copy, titles, roles (the "transport" region, the
 * progressbar, the timer) and how the time reads; the middle never running under its neighbours.
 * No preview, so no hole: the bar paints nothing, sitting over the hero's spread shadow, which
 * paints the main column.
 */
export interface TransportBarProps {
  /** Whether the deck is moving on by itself (pause shows) or holding (play shows). */
  playing: boolean;
  onPlayPause(): void;
  /** Step: -1 previous, 1 next, 0 random. */
  onStep(by: -1 | 0 | 1): void;
  /** Words added to the step buttons' tooltips, e.g. " in the playlist" ('' when none). */
  stepIn: string;
  /**
   * Seconds on the preset playing and its length before the deck moves on (the
   * deck's `seconds`); a null length when it stays until moved on (held, on
   * Link's bars, moving on by itself off): the time on it counts, with no end.
   * Null when nothing plays.
   */
  position: { elapsed: number; length?: number | null } | null;
  onAudioError(e: unknown): void;
  /** The preset playing, left of the time: its name, and where it plays from as `playsFrom` says it ("from Warm-up · 3 of 10"); null or left out: nothing playing. One line, the name brighter, ellipsised before the controls or the audio input give way. */
  now?: { name: string; from?: string } | null;
  /** Whether the deck moves on by itself when not held (a playlist's timing, or Link's bars): the time says so, and that H stays. Left out: it says nothing. */
  moves?: boolean;
}

/** Seconds as m:ss. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * The quiet words after the time, so a newcomer can tell the preset moves on by
 * itself and that Hold (H, or ⏸) stops it: while it moves on, "moves on by
 * itself · H to stay"; held, "staying · H to move on". None when it doesn't move
 * on by itself (`moves` false), held or not.
 */
export function timeHint(playing: boolean, moves: boolean): { text: string; title: string } | null {
  if (!moves) return null;
  return playing
    ? { text: 'moves on by itself · H to stay', title: 'Moves on to the next preset by itself. H, or ⏸, stays on this one until pressed again' }
    : { text: 'staying · H to move on', title: 'Staying on this preset. H, or ▶, moves on by itself again' };
}

/** The bar. */
export function TransportBar({ playing, onPlayPause, onStep, stepIn, position, onAudioError, now, moves = false }: TransportBarProps) {
  const endless = position !== null && (position.length === null || position.length === undefined);
  // Once the length has run out (the deck about to move on, or held there), there is nothing left to count down: the time on it alone, as with no end.
  const spent = position !== null && !endless && position.elapsed >= Math.max(0, position.length ?? 0);
  const open = endless || spent;
  const length = position && !open ? Math.max(0, position.length ?? 0) : 0;
  const elapsed = position ? (open ? Math.max(0, position.elapsed) : Math.min(Math.max(0, position.elapsed), length)) : 0;
  const hint = position ? timeHint(playing, moves) : null;
  return (
    <div className="vs-transport" role="region" aria-label="transport">
      <Group name="keys" label={false} className="vs-transport-keys">
        <Text as="button" weight="strong" type="button" className="vs-transport-key vs-transport-prev" aria-label="previous preset" title={`Previous preset${stepIn} (←)`} onClick={() => onStep(-1)}>
          <Icon name="previous" />
        </Text>
        <Text
          as="button"
          weight="strong"
          type="button"
          className="vs-transport-key vs-transport-play"
          aria-label={playing ? 'pause' : 'play'}
          title={playing ? 'Hold on this preset (H)' : 'Move on by itself again (H)'}
          onClick={onPlayPause}
        >
          <Icon name={playing ? 'pause' : 'play'} size={18} />
        </Text>
        <Text as="button" weight="strong" type="button" className="vs-transport-key" aria-label="next preset" title={`Next preset${stepIn} (→)`} onClick={() => onStep(1)}>
          <Icon name="next" />
        </Text>
        <Text as="button" weight="strong" type="button" className="vs-transport-key vs-transport-random" aria-label="random preset" title={`Random preset${stepIn} (R)`} onClick={() => onStep(0)}>
          R
        </Text>
      </Group>
      <div className="vs-transport-mid">
        {now && (
          <Text as="p" className="vs-transport-now" title={now.from ? `${now.name} ${now.from}` : now.name}>
            <Text weight="strong" className="vs-transport-name">
              {now.name}
            </Text>
            {now.from && (
              <Text className="vs-transport-from">
                <Numbers text={now.from} />
              </Text>
            )}
          </Text>
        )}
        <div className="vs-transport-time" data-off={position ? undefined : ''} data-open={open ? '' : undefined}>
          {open ? (
            <>
              {/* No end to count down to (or none left): the time on it, and a track with nothing to fill. */}
              <Text tabular className="vs-transport-num" ariaRole="timer" aria-label={`time on this preset: ${clock(elapsed)}${endless ? ', until moved on' : ''}`}>
                {clock(elapsed)}
              </Text>
              <div className="vs-transport-track" aria-hidden="true" />
              <Text tabular className="vs-transport-num" aria-hidden="true" />
            </>
          ) : position ? (
            <>
              <Text tabular className="vs-transport-num">
                {clock(elapsed)}
              </Text>
              <div
                className="vs-transport-track"
                role="progressbar"
                aria-label="time on this preset"
                aria-valuemin={0}
                aria-valuemax={length}
                aria-valuenow={elapsed}
                aria-valuetext={`${clock(elapsed)} of ${clock(length)}`}
              >
                <div className="vs-transport-fill" style={{ width: length ? `${(elapsed / length) * 100}%` : '0%' }} />
              </div>
              <Text tabular className="vs-transport-num">
                −{clock(length - elapsed)}
              </Text>
            </>
          ) : (
            <div className="vs-transport-track" aria-hidden="true" />
          )}
          {hint && (
            <Text className="vs-transport-hint" title={hint.title}>
              {hint.text}
            </Text>
          )}
        </div>
      </div>
      <Text as="div" className="vs-transport-right">
        <FrameRate slowOnly />
        <SourcePicker onError={onAudioError} channels="none" width={180} />
      </Text>
    </div>
  );
}
