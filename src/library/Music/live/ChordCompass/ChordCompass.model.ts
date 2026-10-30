// ChordCompass's model: the circle of fifths with the progression drawn round it, and the tree both
// renderers draw. No framework: `ChordCompass.tsx` and `ChordCompass.svelte` both pass
// `chordCompassView` and `chordCompassHandlers` to their `Tree`. The pane holds no state: a wedge
// only asks `onPick`, the switch `onFollow`, the lock `onBassLock`.
import { component, h, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { liveAxis, liveHead, livePane, liveReading } from '../live.model';
import { polar, sector, type Point } from '../polar';
import type { ChordCompassForm } from './ChordCompass.forms';

/** The circle of fifths, clockwise from the top: the majors outside, their relative minors inside. */
export const MAJORS = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'] as const;
export const MINORS = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'] as const;

/** What the band follows: the chord keyboard as played, or the recorded progression. */
export const FOLLOW_MODES = ['keys', 'prog'] as const;
export type FollowMode = (typeof FOLLOW_MODES)[number];
const FOLLOW_LABELS: Record<FollowMode, string> = { keys: 'Keys', prog: 'Prog' };

export type CompassRing = 'major' | 'minor';

/** One chord of the progression loop. */
export interface CompassChord {
  id: string;
  /** As written: `'Dm7'`, `'G/B'`, `'Cmaj7'`. */
  name: string;
  /** Its notes, for the readout: `['D', 'F', 'A', 'C']`. */
  notes?: readonly string[];
  /** How long it lasts, in beats. */
  beats?: number;
}

export interface ChordCompassProps {
  /** The progression loop, in order. It is drawn as a closed path round the wheel. */
  chords: readonly CompassChord[];
  /** The chord playing now (an index into `chords`). */
  index: number;
  /** The tonic of the song's key (`'C'`): its wedge and its two neighbours on both rings are shaded. */
  keyName?: string;
  /** Beats until the next chord (the current chord's length when left out). */
  beatsToNext?: number;
  follow?: FollowMode;
  /** The follow switch was pressed: its next mode. Without it the switch is read-only. */
  onFollow?: (mode: FollowMode) => void;
  /** The bass generator holds the root through passing chords. */
  bassLock?: boolean;
  onBassLock?: (on: boolean) => void;
  /** A wedge was picked: its chord name (`'C'`, `'Dm'`). Without it the wheel is read-only. */
  onPick?: (chord: string) => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: ChordCompassForm;
  className?: string;
}

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Where a chord name sits on the wheel: its ring and its slot. `'G/B'` places as G, `'Dm7'` as Dm. */
export function placeChord(name: string): { ring: CompassRing; slot: number } | null {
  const m = /^([A-G])([♯#♭b]?)(.*)$/.exec(name.split('/')[0]);
  if (!m) return null;
  const pc = (LETTER[m[1]] + (m[2] === '♯' || m[2] === '#' ? 1 : m[2] === '♭' || m[2] === 'b' ? -1 : 0) + 12) % 12;
  const minor = /^m(?!aj)/.test(m[3]) || m[3].startsWith('dim');
  return minor ? { ring: 'minor', slot: ((((pc + 3) * 7) % 12) + 12) % 12 } : { ring: 'major', slot: (((pc * 7) % 12) + 12) % 12 };
}

/** The rings' radii in the 200-unit wheel: the majors' band outside the minors'. */
const R: Record<CompassRing, readonly [number, number]> = { major: [66, 96], minor: [38, 66] };
/** Names sit in the outer part of a band, the progression's path runs in the inner part, so they never overlap. */
const LABEL: Record<CompassRing, number> = { major: 85, minor: 57 };
const PATH: Record<CompassRing, number> = { major: 72, minor: 45 };
const FONT: Record<CompassRing, string> = { major: '11', minor: '9' };
const HUB = 36;

const f = (n: number) => n.toFixed(1);
const slotTurns = (slot: number): [number, number] => [(slot - 0.5) / 12, (slot + 0.5) / 12];
const vertex = (p: { ring: CompassRing; slot: number }): Point => polar(0, 0, PATH[p.ring], p.slot / 12);
const same = (a: { ring: CompassRing; slot: number } | null, ring: CompassRing, slot: number) => a !== null && a.ring === ring && a.slot === slot;

/** The progression's outline: a closed path through each chord's slot, in order. */
export function loopPath(chords: readonly CompassChord[]): string {
  const points = chords.map((c) => placeChord(c.name)).filter((p): p is NonNullable<typeof p> => p !== null).map(vertex);
  return points.length > 1 ? `M${points.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}Z` : '';
}

/** The wedge's handler keys: `pick:<name>` on click, `key:<name>` on keydown. */
const pickKey = (name: string) => `pick:${name}`;
const keyKey = (name: string) => `key:${name}`;

/**
 * The tree ChordCompass draws: the wheel (24 flat wedges, the key's three slots tinted, the chord
 * now solid `--primary`, the next outlined; the progression a thin closed path with its stops, the
 * move about to happen the one strong segment ending on a ring; the hub with the chord in mono)
 * and, in `wheel`, the readout column beside it. `form` is the binding's (`useForm` / `getForm`).
 */
export function chordCompassView(
  { chords, index, keyName, beatsToNext, follow = 'prog', onFollow, bassLock = false, onBassLock, onPick, className }: ChordCompassProps,
  form: ChordCompassForm,
): Node {
  const now = chords[index];
  const next = chords.length > 1 ? chords[(index + 1) % chords.length] : undefined;
  const placedNow = now ? placeChord(now.name) : null;
  const placedNext = next ? placeChord(next.name) : null;
  const tonic = keyName ? placeChord(keyName) : null;
  const inKey = (slot: number) => tonic !== null && [11, 0, 1].includes((slot - tonic.slot + 12) % 12);
  const visited = new Set(chords.map((c) => placeChord(c.name)).filter((p) => p !== null).map((p) => `${p.ring}${p.slot}`));
  const stops = chords.map((c) => placeChord(c.name)).filter((p): p is NonNullable<typeof p> => p !== null);
  const from = placedNow ? vertex(placedNow) : null;
  const to = placedNext ? vertex(placedNext) : null;
  const moves = from !== null && to !== null && (from.x !== to.x || from.y !== to.y);
  const beats = beatsToNext ?? now?.beats ?? 4;
  const dial = form === 'dial';

  const wedge = (ring: CompassRing, name: string, slot: number): Node => {
    const [a, b] = slotTurns(slot);
    const label = polar(0, 0, LABEL[ring], slot / 12);
    const isNow = same(placedNow, ring, slot);
    const isNext = !isNow && same(placedNext, ring, slot);
    const node = h(
      'g',
      {
        class: 'live-compass-wedge',
        'data-ring': ring,
        'data-key': inKey(slot) ? 'true' : undefined,
        'data-state': isNow ? 'now' : isNext ? 'next' : undefined,
        'data-visited': visited.has(`${ring}${slot}`) ? 'true' : undefined,
        role: onPick ? 'button' : undefined,
        tabindex: onPick ? '0' : undefined,
        'aria-label': onPick ? `${name}${isNow ? ', playing' : isNext ? ', next' : ''}` : undefined,
      },
      h('path', { d: sector(0, 0, R[ring][0], R[ring][1], a, b) }),
      h('text', { x: f(label.x), y: f(label.y), dy: '0.35em', 'font-size': FONT[ring] }, name),
    );
    return { ...(onPick ? wire(node, { on: { click: pickKey(name), keydown: keyKey(name) } }) : node), key: `${ring}${slot}` };
  };

  const nextOutline = placedNext && !same(placedNow, placedNext.ring, placedNext.slot)
    ? h('path', { class: 'live-compass-next', d: sector(0, 0, R[placedNext.ring][0], R[placedNext.ring][1], ...slotTurns(placedNext.slot)) })
    : null;

  const wheel = h(
    'svg',
    {
      class: 'live-compass-wheel',
      viewBox: '-100 -100 200 200',
      role: 'group',
      'aria-label': `Circle of fifths: ${now?.name ?? 'no chord'} now${next ? `, ${next.name} next` : ''}`,
    },
    h('g', { 'data-part': 'majors' }, ...MAJORS.map((n, i) => wedge('major', n, i))),
    h('g', { 'data-part': 'minors' }, ...MINORS.map((n, i) => wedge('minor', n, i))),
    nextOutline,
    h('circle', { class: 'live-compass-hub-face', r: String(HUB) }),
    h(
      'g',
      { class: 'live-compass-prog', 'data-part': 'progression', 'aria-hidden': 'true' },
      h('path', { class: 'live-compass-loop', d: loopPath(chords) }),
      when(moves, () => h('line', { class: 'live-compass-move', x1: f(from!.x), y1: f(from!.y), x2: f(to!.x), y2: f(to!.y) })),
      ...stops.map((p, i) => {
        const v = vertex(p);
        return { ...h('circle', { class: 'live-compass-stop', cx: f(v.x), cy: f(v.y), r: '1.6' }), key: `stop${i}` };
      }),
      when(to !== null, () => h('circle', { class: 'live-compass-land', cx: f(to!.x), cy: f(to!.y), r: '4.5' })),
    ),
    h(
      'g',
      { class: 'live-compass-hub', 'data-part': 'hub' },
      h('text', { class: 'live-compass-hub-chord', y: dial ? '-1' : '2', 'font-size': dial ? '17' : '13' }, now?.name ?? '—'),
      dial
        ? h('text', { class: 'live-compass-hub-then', y: '14', 'font-size': '8' }, next ? `then ${next.name}` : '')
        : h('text', { class: 'live-compass-hub-then', y: '15', 'font-size': '8' }, keyName ? `key ${keyName}` : ''),
    ),
  );

  return livePane(
    'compass',
    { class: className, 'data-form': form },
    wheel,
    when(!dial, () =>
      h(
        'div',
        { class: 'live-compass-readout', 'data-part': 'readout' },
        liveHead({ title: 'Chord', sub: next ? `next ${next.name}` : undefined, aside: keyName ? `key ${keyName}` : undefined }),
        h('span', { class: 'live-compass-chord', 'data-part': 'chord' }, now?.name ?? '—'),
        liveReading(now?.notes?.join(' ') ?? '', { 'data-part': 'notes' }),
        h(
          'p',
          { class: 'live-compass-next-line', 'data-part': 'next' },
          next ? [liveAxis('next in'), liveReading(`${beats} ${beats === 1 ? 'beat' : 'beats'}`)] : liveAxis('no next chord'),
        ),
        h(
          'div',
          { class: 'live-compass-tools' },
          component('MusicSegmented', { name: 'Follow', items: FOLLOW_MODES.map((m) => FOLLOW_LABELS[m]), index: FOLLOW_MODES.indexOf(follow), disabled: onFollow === undefined }, { on: { onChange: 'follow' } }),
          component('MusicToggle', { name: 'Bass', label: 'Bass lock', on: bassLock, width: 44, disabled: onBassLock === undefined }, { on: { onChange: 'bassLock' }, slots: { children: ['Lock'] } }),
        ),
      ),
    ),
  );
}

/** The callbacks the tree names: one pick and one key per wedge, the switch and the lock. */
export function chordCompassHandlers({ onFollow, onBassLock, onPick }: ChordCompassProps): Handlers {
  const handlers: Handlers = {
    follow: (i: number) => {
      const mode = FOLLOW_MODES[i];
      if (mode !== undefined) onFollow?.(mode);
    },
    bassLock: (on: boolean) => onBassLock?.(on),
  };
  for (const name of [...MAJORS, ...MINORS]) {
    handlers[pickKey(name)] = () => onPick?.(name);
    handlers[keyKey(name)] = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onPick?.(name);
    };
  }
  return handlers;
}
