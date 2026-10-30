import type { KeyboardEvent } from 'react';
import { useForm } from '../../../layout/assembly';
import { Text } from '../../../primitives/Text';
import { Segmented } from '../../../components/core/Segmented/Segmented';
import { LampButton } from '../../../components/core/LampButton/LampButton';
import type { LiveChord } from '../../../components/music/live.model';
import { polar, sector } from '../../geometry';
import { CHORD_COMPASS_FORMS, type ChordCompassForm } from './ChordCompass.forms';
import './ChordCompass.css';

/** The circle of fifths, clockwise from the top: the majors outside, their relative minors inside. */
export const MAJORS = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'] as const;
export const MINORS = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'] as const;

export const FOLLOW_MODES = ['keys', 'prog'] as const;
export type FollowMode = (typeof FOLLOW_MODES)[number];

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Where a chord name sits on the wheel: its ring and its slot. `'G/B'` places as G, `'Dm7'` as Dm. */
export function placeChord(name: string): { ring: 'major' | 'minor'; slot: number } | null {
  const m = /^([A-G])([♯#♭b]?)(.*)$/.exec(name.split('/')[0]);
  if (!m) return null;
  const pc = (LETTER[m[1]] + (m[2] === '♯' || m[2] === '#' ? 1 : m[2] === '♭' || m[2] === 'b' ? -1 : 0) + 12) % 12;
  const minor = /^m(?!aj)/.test(m[3]) || m[3].startsWith('dim');
  return minor ? { ring: 'minor', slot: (((pc + 3) * 7) % 12 + 12) % 12 } : { ring: 'major', slot: ((pc * 7) % 12 + 12) % 12 };
}

export interface ChordCompassProps {
  /** Draw this form, outside an assembled screen (a screen's own choice wins inside one). */
  form?: ChordCompassForm;
  /** The progression loop, in order. It is drawn as a path round the wheel. */
  chords: readonly LiveChord[];
  /** The chord playing now. */
  index: number;
  /** The tonic of the song's key (`'C'`): its wedge and its two neighbours on both rings are shaded. */
  keyName?: string;
  /** Beats until the next chord, for the readout. */
  beatsToNext?: number;
  /** What the band follows: the chord keyboard as played, or the recorded progression. */
  follow?: FollowMode;
  onFollow?: (mode: FollowMode) => void;
  /** The bass generator holds the root through passing chords. */
  bassLock?: boolean;
  onBassLock?: (on: boolean) => void;
  /** A wedge was picked: audition it, or override the next chord (the app decides). */
  onPick?: (chord: string) => void;
  className?: string;
}

const R = { major: [66, 96], minor: [38, 66] } as const;
/** Where a ring's names sit (outer part of the band) and where the progression's path runs (inner part), so the two never overlap. */
const LABEL = { major: 85, minor: 58 } as const;
const PATH = { major: 72, minor: 45 } as const;
const slotTurns = (slot: number): [number, number] => [(slot - 0.5) / 12, (slot + 0.5) / 12];

/**
 * **Job.** Say where the harmony is and where it's going, at a glance from the keys: the chord
 * now, the next one, the song's key and the whole progression loop as one shape.
 *
 * **Representation.** The circle of fifths: majors round the outside, relative minors inside, the
 * song's key a shaded wedge three slots wide. The progression is a closed path between the chords'
 * slots — a ii–V–I is a short hop, a borrowed chord a long chord across the wheel, so a
 * progression's character is its outline. The current chord's wedge is solid; the next move is
 * the one strong segment of the path, ending in a ring on the chord it lands on.
 *
 * **Behaviour.** Controlled: a wedge asks `onPick(name)`; the follow switch and the bass lock ask
 * for their next values. Nothing changes itself.
 *
 * **Forms** (`CHORD_COMPASS_FORMS`): `wheel` the wheel beside a readout column, `dial` the wheel
 * alone with the chord in its middle.
 */
export function ChordCompass({ form: given, chords, index, keyName, beatsToNext, follow = 'prog', onFollow, bassLock = false, onBassLock, onPick, className }: ChordCompassProps) {
  const form = useForm(CHORD_COMPASS_FORMS, given);
  const now = chords[index];
  const next = chords.length ? chords[(index + 1) % chords.length] : undefined;
  const placedNow = now ? placeChord(now.name) : null;
  const placedNext = next ? placeChord(next.name) : null;
  const tonic = keyName ? placeChord(keyName) : null;
  const inKey = (slot: number) => tonic !== null && [11, 0, 1].includes((slot - tonic.slot + 12) % 12);
  const visited = new Set(chords.map((c) => placeChord(c.name)).filter(Boolean).map((p) => `${p!.ring}${p!.slot}`));

  const vertex = (p: { ring: 'major' | 'minor'; slot: number }) => polar(0, 0, PATH[p.ring], p.slot / 12);
  const points = chords.map((c) => placeChord(c.name)).filter((p): p is NonNullable<typeof p> => p !== null).map(vertex);
  const loop = points.length > 1 ? `M${points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}Z` : '';
  const from = placedNow ? vertex(placedNow) : null;
  const to = placedNext ? vertex(placedNext) : null;

  const pickKey = (name: string) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPick?.(name);
    }
  };

  const wedge = (ring: 'major' | 'minor', name: string, slot: number) => {
    const [a, b] = slotTurns(slot);
    const label = polar(0, 0, LABEL[ring], slot / 12);
    const isNow = placedNow?.ring === ring && placedNow.slot === slot;
    const isNext = placedNext?.ring === ring && placedNext.slot === slot;
    return (
      <g
        key={`${ring}${slot}`}
        className="lv-compass__wedge"
        data-ring={ring}
        data-key={inKey(slot) ? 'true' : undefined}
        data-now={isNow ? 'true' : undefined}
        data-next={isNext && !isNow ? 'true' : undefined}
        data-visited={visited.has(`${ring}${slot}`) ? 'true' : undefined}
        role={onPick ? 'button' : undefined}
        tabIndex={onPick ? 0 : undefined}
        aria-label={onPick ? `${name}${isNow ? ', playing' : isNext ? ', next' : ''}` : undefined}
        onClick={onPick ? () => onPick(name) : undefined}
        onKeyDown={onPick ? pickKey(name) : undefined}
      >
        <path d={sector(0, 0, R[ring][0], R[ring][1], a, b)} />
        <text x={label.x} y={label.y} dy="0.35em" fontSize={ring === 'major' ? 11 : 8.5}>
          {name}
        </text>
      </g>
    );
  };

  return (
    <div className={`lv-compass${className ? ` ${className}` : ''}`} data-form={form}>
      <svg className="lv-compass__wheel" viewBox="-100 -100 200 200" role="img" aria-label={`Circle of fifths: ${now?.name ?? 'no chord'} now, ${next?.name ?? 'none'} next`}>
        {MAJORS.map((n, i) => wedge('major', n, i))}
        {MINORS.map((n, i) => wedge('minor', n, i))}
        <path className="lv-compass__loop" d={loop} />
        {from && to && (from.x !== to.x || from.y !== to.y) && <line className="lv-compass__move" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />}
        {to && <circle className="lv-compass__land" cx={to.x} cy={to.y} r={4.5} />}
        {points.map((p, i) => (
          <circle key={i} className="lv-compass__stop" cx={p.x} cy={p.y} r={1.8} />
        ))}
        <circle className="lv-compass__hub" r={36} />
        {form === 'dial' ? (
          <>
            <text className="lv-compass__now" y={-2} fontSize={18}>
              {now?.name ?? '—'}
            </text>
            <text className="lv-compass__then" y={14} fontSize={7.5}>
              {next ? `then ${next.name}` : ''}
            </text>
          </>
        ) : (
          <text className="lv-compass__then" y={3} fontSize={8}>
            {keyName ? `key ${keyName}` : ''}
          </text>
        )}
      </svg>
      {form === 'wheel' && (
        <div className="lv-compass__readout">
          <Text role="caption" tone="muted" case="label">
            Chord now
          </Text>
          <Text role="display" leading="tight">
            {now?.name ?? '—'}
          </Text>
          <Text role="caption" tone="secondary" tabular>
            {now?.notes?.join(' ') ?? ''}
          </Text>
          <Text role="label" tone="secondary">
            {next ? `${next.name} in ${beatsToNext ?? next.beats ?? 4} ${(beatsToNext ?? 4) === 1 ? 'beat' : 'beats'}` : ''}
          </Text>
          <Segmented name="Follow" items={['Keys', 'Prog']} index={FOLLOW_MODES.indexOf(follow)} onChange={(i) => onFollow?.(FOLLOW_MODES[i])} disabled={!onFollow} />
          <LampButton label="Bass lock" on={bassLock} hue="t" onToggle={(on) => onBassLock?.(on)} disabled={!onBassLock} />
        </div>
      )}
    </div>
  );
}

ChordCompass.forms = CHORD_COMPASS_FORMS;
