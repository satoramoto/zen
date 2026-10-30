// OrbitClock's model: the generators as orbits, one ring each, and the tree both renderers draw
// from them. No framework: `OrbitClock.tsx` and `OrbitClock.svelte` both pass `orbitClockView` and
// `orbitClockHandlers` to their `Tree`. No clock either: every hand is read from the `beat` prop,
// and a press only asks a callback.
import { component, each, h, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { inkStyle, liveHead, livePane, liveReading, type LiveTrackRef } from '../live.model';
import { arc, frac, polar } from '../polar';
import type { OrbitClockForm } from './OrbitClock.forms';

/** One step generator on its own cycle: what it plays, how many steps, which of them fire. */
export interface OrbitGenerator {
  /** The track it plays (a `tracks` id). */
  track: string;
  /** `'EUCLID'`, `'ARP'`, `'CHANCE'`. */
  kind: string;
  /** Steps in its cycle. */
  steps: number;
  /** The steps that fire, 0-based. */
  hits: readonly number[];
  /** Steps per beat: 4 is sixteenths. */
  rate: number;
  /** What it reads as: `'E(5,8) · root 5th'`. */
  hint: string;
}

/** What a bead is right now: a firing step, a rest, and either one under its hand. */
export const BEAD_STATES = ['hit', 'rest', 'lit', 'passing'] as const;
export type BeadState = (typeof BEAD_STATES)[number];

export interface OrbitClockProps {
  /** The generators, outermost ring first. */
  generators: readonly OrbitGenerator[];
  /** The tracks they play, for their names and inks. */
  tracks: readonly LiveTrackRef[];
  /** The set clock in beats (a float): every hand's place is read from it. */
  beat: number;
  /** 0 deterministic … 1 drunk: the faint dashed arc round the outside, as long as it is strong. */
  chaos?: number;
  /** The chord the generators follow, in the hub. */
  chord?: string;
  /** The generator the dice act on (a track id). */
  selected?: string;
  /** A ring or its row was pressed. Without it the orbits are read, not pressed. */
  onSelect?: (track: string) => void;
  /** Nudge the selected generator. */
  onMutate?: () => void;
  /** Shake every generator a little. */
  onShake?: () => void;
  /** Keep the result as a clip. */
  onKeep?: () => void;
  /** Undo the last dice. */
  onRevert?: () => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: OrbitClockForm;
  className?: string;
}

const OUTER = 86;
const INNER = 34;
const n = (v: number): string => v.toFixed(2);
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * When every hand is next back at twelve o'clock together: the cycles' least common multiple
 * (`every`, in beats) and the beats `left` until it. Rates and steps are whole numbers.
 */
export function orbitMeet(generators: readonly OrbitGenerator[], beat: number): { every: number; left: number } {
  if (generators.length === 0) return { every: 0, left: 0 };
  const rate = generators.reduce((r, g) => (r * g.rate) / gcd(r, g.rate), 1);
  const steps = generators.reduce((l, g) => {
    const s = g.steps * (rate / g.rate);
    return (l * s) / gcd(l, s);
  }, 1);
  const every = steps / rate;
  return { every, left: every - (((beat % every) + every) % every) };
}

/** Where a generator's hand is: its phase round the ring (turns) and the step under it. */
export function orbitHand(g: OrbitGenerator, beat: number): { phase: number; step: number } {
  const phase = frac((beat * g.rate) / Math.max(g.steps, 1));
  return { phase, step: Math.min(g.steps - 1, Math.floor(phase * g.steps)) };
}

/** The hub's second line: when the hands meet again, in bars of four. */
export function meetText(generators: readonly OrbitGenerator[], beat: number): string {
  if (generators.length < 2) return '';
  const { every, left } = orbitMeet(generators, beat);
  if (every - left < 0.25) return 'together now';
  const bars = Math.ceil(left / 4);
  return `meet in ${bars} ${bars === 1 ? 'bar' : 'bars'}`;
}

function ring(g: OrbitGenerator, index: number, count: number, beat: number, track: LiveTrackRef | undefined, selected: boolean, live: boolean): Node {
  const gap = count > 1 ? (OUTER - INNER) / (count - 1) : 0;
  const r = count > 1 ? OUTER - index * gap : (OUTER + INNER) / 2;
  const band = count > 1 ? gap : 24;
  const bead = Math.min(3, band * 0.24);
  const { phase, step } = orbitHand(g, beat);
  const hits = new Set(g.hits);
  const [i0, i1] = [polar(0, 0, r - band * 0.36, phase), polar(0, 0, r + band * 0.36, phase)];
  const name = track?.name ?? g.track;
  const beads = Array.from({ length: g.steps }, (_, s) => {
    const p = polar(0, 0, r, s / g.steps);
    const hit = hits.has(s);
    const state: BeadState = s === step ? (hit ? 'lit' : 'passing') : hit ? 'hit' : 'rest';
    const size = hit ? (s === step ? bead * 1.15 : bead) : s === step ? 1.3 : 0.8;
    return h('circle', { class: 'live-orbit-bead', 'data-state': state, cx: n(p.x), cy: n(p.y), r: n(size) });
  });
  const body = h(
    'g',
    {
      class: 'live-orbit-ring',
      'data-track': g.track,
      'data-selected': selected ? 'true' : undefined,
      style: inkStyle(track?.ink),
      role: live ? 'button' : undefined,
      tabindex: live ? '0' : undefined,
      'aria-pressed': live ? (selected ? 'true' : 'false') : undefined,
      'aria-label': `${name}: ${g.kind} ${g.hint}`,
    },
    h('circle', { class: 'live-orbit-hit', r: n(r), 'stroke-width': n(band * 0.9) }),
    h('circle', { class: 'live-orbit-track', r: n(r) }),
    h('path', { class: 'live-orbit-tail', d: arc(0, 0, r, phase - 0.09, phase) }),
    ...beads,
    h('line', { class: 'live-orbit-hand', x1: n(i0.x), y1: n(i0.y), x2: n(i1.x), y2: n(i1.y) }),
  );
  return live ? wire(body, { on: { click: `select:${g.track}`, keydown: `key:${g.track}` } }) : body;
}

function row(g: OrbitGenerator, track: LiveTrackRef | undefined, selected: boolean, live: boolean): Node {
  const name = track?.name ?? g.track;
  return wire(
    h(
      'button',
      {
        class: 'live-orbit-row',
        type: 'button',
        style: inkStyle(track?.ink),
        'data-track': g.track,
        'aria-pressed': selected ? 'true' : 'false',
        'aria-label': `${name} generator, ${g.kind}`,
        disabled: live ? undefined : '',
      },
      h('span', { class: 'live-orbit-letter', 'aria-hidden': 'true' }, name.slice(0, 1)),
      h('span', { class: 'live-orbit-name' }, name),
      h('span', { class: 'live-orbit-kind' }, g.kind),
      h('span', { class: 'live-orbit-hint' }, g.hint),
    ),
    { on: { click: `select:${g.track}` } },
  );
}

const die = (label: string, key: string, live: boolean) =>
  component('MusicButton', { label, disabled: !live, className: 'live-orbit-die' }, { on: { onPress: key }, slots: { children: [label] } });

/**
 * The tree OrbitClock draws: a square dial of thin rings, one per generator (outermost first),
 * each with its steps as beads, a hand and its tail at the generator's own phase, the bead under
 * the hand lit; the twelve o'clock tick, the chaos arc, and the hub's chord and "meet in N bars".
 * `full` adds the head row, the generator list and the dice. `form` is the binding's.
 */
export function orbitClockView(props: OrbitClockProps, form: OrbitClockForm): Node {
  const { generators, tracks, beat, chaos = 0, chord, selected, onSelect, onMutate, onShake, onKeep, onRevert, className } = props;
  const full = form === 'full';
  const live = onSelect !== undefined;
  const track = (id: string) => tracks.find((t) => t.id === id);
  const { every } = orbitMeet(generators, beat);
  const meet = meetText(generators, beat);
  const chaosArc = Math.max(0, Math.min(1, chaos));
  const label = generators.length === 0 ? 'No generators' : `${generators.length} generators${meet ? `, ${meet}` : ''}`;

  const dial = h(
    'div',
    { class: 'live-orbit-sky', 'data-part': 'orbits' },
    h(
      'div',
      { class: 'live-orbit-dial' },
      h(
        'svg',
        { class: 'live-orbit-svg', viewBox: '-100 -100 200 200', role: 'group', 'aria-label': label },
        when(chaosArc > 0, () => h('path', { class: 'live-orbit-chaos', 'data-part': 'chaos', d: arc(0, 0, 96, 0, chaosArc) })),
        h('line', { class: 'live-orbit-noon', x1: '0', y1: n(-INNER + 12), x2: '0', y2: n(-OUTER - 8) }),
        ...each(generators, (g) => g.track, (g, i) => ring(g, i, generators.length, beat, track(g.track), g.track === selected, live)),
      ),
      h(
        'div',
        { class: 'live-orbit-hub', 'data-part': 'hub' },
        h('span', { class: 'live-orbit-chord' }, generators.length === 0 ? '—' : chord ?? ''),
        when(meet !== '', () => h('span', { class: 'live-orbit-meet' }, meet)),
      ),
    ),
  );

  return livePane(
    'orbit',
    { class: className, 'data-form': form },
    when(full, () =>
      liveHead({ title: 'Orbits', sub: generators.length ? `${generators.length} generators · cycle ${every / 4} bars` : 'no generators', aside: `chaos ${chaos.toFixed(2)}` }),
    ),
    h(
      'div',
      { class: 'live-orbit-body' },
      dial,
      when(full, () =>
        h(
          'div',
          { class: 'live-orbit-side', 'data-part': 'side' },
          h('div', { class: 'live-orbit-list', role: 'group', 'aria-label': 'Generators' }, ...each(generators, (g) => g.track, (g) => row(g, track(g.track), g.track === selected, live))),
          h(
            'div',
            { class: 'live-orbit-dice', role: 'group', 'aria-label': 'Dice' },
            die('Mutate', 'mutate', onMutate !== undefined),
            die('Shake all', 'shake', onShake !== undefined),
            die('Keep', 'keep', onKeep !== undefined),
            die('Revert', 'revert', onRevert !== undefined),
          ),
          when(selected !== undefined && track(selected) !== undefined, () => liveReading(`dice → ${track(selected!)!.name}`)),
        ),
      ),
    ),
  );
}

/** The callbacks the tree names: `select:<track>` and `key:<track>` per generator, and the four dice. */
export function orbitClockHandlers({ generators, onSelect, onMutate, onShake, onKeep, onRevert }: OrbitClockProps): Handlers {
  const handlers: Handlers = {
    mutate: onMutate && (() => onMutate()),
    shake: onShake && (() => onShake()),
    keep: onKeep && (() => onKeep()),
    revert: onRevert && (() => onRevert()),
  };
  for (const { track } of generators) {
    handlers[`select:${track}`] = () => onSelect?.(track);
    handlers[`key:${track}`] = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onSelect?.(track);
    };
  }
  return handlers;
}
