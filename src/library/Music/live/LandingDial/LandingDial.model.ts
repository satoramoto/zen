// LandingDial's model: the transition carrying the set somewhere, as a countdown ring, and the tree
// both renderers draw. No framework: `LandingDial.tsx` and `LandingDial.svelte` both pass
// `landingDialView` and `landingDialHandlers` to their `Tree`. The dial holds no state and runs no
// clock: the bar now fills from the `beat` it is given; the switches and Cancel only ask.
import { component, h, when, type Handlers, type Node } from '../../../view/Tree.model';
import { liveAxis, liveHead, livePane, liveReading } from '../live.model';
import { frac, sector } from '../polar';
import type { LandingDialForm } from './LandingDial.forms';

/** What a transition lands on. */
export const LANDING_TARGETS = ['song', 'section', 'scene'] as const;
export type LandingTarget = (typeof LANDING_TARGETS)[number];

/** How long a transition runs, in bars. */
export const LANDING_LENGTHS = [4, 8, 16] as const;
export type LandingLength = (typeof LANDING_LENGTHS)[number];

/** A bar of the ring: played, filling now, still to come, or nothing counting. */
export const LANDING_BAR_STATES = ['gone', 'now', 'ahead', 'off'] as const;
export type LandingBarState = (typeof LANDING_BAR_STATES)[number];

export const TARGET_LABELS: Record<LandingTarget, string> = { song: 'Next song', section: 'Next section', scene: 'Next scene' };

export interface LandingDialProps {
  /** The transition carrying the set there: `'RISER'`. */
  via: string;
  /** What it lands on: `'Wire'`. */
  lands: string;
  /** About it: `'118 · G'`. */
  landsHint?: string;
  /** What hits on the one when it lands: `'DROP'`. */
  hit?: string;
  target: LandingTarget;
  /** The target switch was pressed. Without it the switch is read-only. */
  onTarget?: (target: LandingTarget) => void;
  /** The transition's length in bars. */
  length: LandingLength;
  onLength?: (length: LandingLength) => void;
  /** Whole bars left before it lands. */
  barsLeft: number;
  /** The set clock in beats (4 to the bar): the bar now fills with it. */
  beat: number;
  /** Counting down. Disarmed, the ring is a dashed outline and nothing counts. */
  armed: boolean;
  /** Cancel was pressed (only while armed). */
  onCancel?: () => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: LandingDialForm;
  className?: string;
}

/** The turns left between two bars. */
const GAP = 0.006;

/** Each bar's state: bars gone, the bar now, bars ahead; every bar `off` when disarmed. */
export function landingBars(length: number, barsLeft: number, armed: boolean): LandingBarState[] {
  const gone = Math.max(0, length - Math.max(0, barsLeft));
  return Array.from({ length }, (_, i) => (!armed ? 'off' : i < gone ? 'gone' : i === gone ? 'now' : 'ahead'));
}

/** The ring of `length` bars between radii `r0` and `r1`, the bar now filled to `inBar` (0–1). */
function ring(length: number, barsLeft: number, armed: boolean, inBar: number, r0: number, r1: number): Node[] {
  return landingBars(length, barsLeft, armed).map((state, i) => {
    const a = i / length + GAP;
    const b = (i + 1) / length - GAP;
    return {
      ...h(
        'g',
        { class: 'live-land-bar', 'data-state': state, 'data-down': i === length - 1 ? 'true' : undefined },
        h('path', { d: sector(0, 0, r0, r1, a, b) }),
        when(state === 'now' && inBar > 0, () => h('path', { class: 'live-land-fill', d: sector(0, 0, r0, r1, a, a + (b - a) * inBar) })),
      ),
      key: `bar${i}`,
    };
  });
}

/** What the dial says aloud. */
function sayLanding({ via, lands, barsLeft, armed }: LandingDialProps): string {
  if (!lands) return 'Nothing to land on';
  return armed ? `${via} lands on ${lands} in ${barsLeft} ${barsLeft === 1 ? 'bar' : 'bars'}` : `${via} to ${lands}, not armed`;
}

/**
 * The tree LandingDial draws. `dial`: the head, the countdown ring cut into the transition's bars
 * (gone solid `--primary`, the bar now filling with the beat, bars ahead faint, the landing
 * downbeat a rule at twelve), the bars left in big mono in its middle with `via` above, what it
 * lands on and what hits on the one under it, then the target and length switches and Cancel.
 * `chip`: one line, a mini ring, the bars left and `via → lands`. `form` is the binding's.
 */
export function landingDialView(props: LandingDialProps, form: LandingDialForm): Node {
  const { via, lands, landsHint, hit, target, onTarget, length, onLength, barsLeft, beat, armed, onCancel, className } = props;
  const inBar = frac(beat / 4);
  const say = sayLanding(props);
  const count = armed ? String(barsLeft) : '–';

  if (form === 'chip')
    return livePane(
      'land',
      { class: className, 'data-form': form, 'data-armed': armed ? 'true' : undefined, role: 'status', 'aria-label': say },
      h('svg', { class: 'live-land-mini', viewBox: '-12 -12 24 24', 'aria-hidden': 'true' }, ...ring(length, barsLeft, armed, inBar, 6, 11)),
      h('span', { class: 'live-land-chip-count' }, count),
      h('span', { class: 'live-land-chip-route' }, lands ? `${via} → ${lands}` : 'nothing queued'),
    );

  return livePane(
    'land',
    { class: className, 'data-form': form, 'data-armed': armed ? 'true' : undefined },
    liveHead({ title: 'Landing', sub: TARGET_LABELS[target], aside: armed ? `${length} bars` : 'not armed' }),
    h(
      'svg',
      { class: 'live-land-ring', viewBox: '-100 -100 200 200', role: 'img', 'aria-label': say },
      ...ring(length, barsLeft, armed, inBar, 70, 94),
      h('line', { class: 'live-land-down', x1: '0', y1: '-64', x2: '0', y2: '-100' }),
      h('text', { class: 'live-land-via', y: '-30', 'font-size': '11' }, via),
      h('text', { class: 'live-land-count', y: '17', 'font-size': '50' }, count),
      h('text', { class: 'live-land-unit', y: '36', 'font-size': '9' }, armed ? (barsLeft === 1 ? 'bar to land' : 'bars to land') : 'not armed'),
    ),
    h(
      'div',
      { class: 'live-land-says', 'data-part': 'lands' },
      lands
        ? h('p', { class: 'live-land-line' }, liveAxis('lands on'), h('b', { class: 'live-land-target' }, lands), when(!!landsHint, () => liveReading(`· ${landsHint}`)))
        : h('p', { class: 'live-land-line' }, liveAxis('nothing queued')),
      when(!!hit, () => h('p', { class: 'live-land-line live-land-hit' }, h('b', {}, hit!), liveAxis('hits the one'))),
    ),
    h(
      'div',
      { class: 'live-land-switches' },
      component('MusicSegmented', { name: 'Lands on', items: LANDING_TARGETS.map((t) => TARGET_LABELS[t]), index: LANDING_TARGETS.indexOf(target), disabled: onTarget === undefined }, { on: { onChange: 'target' } }),
      component('MusicSegmented', { name: 'Bars', items: LANDING_LENGTHS.map(String), index: LANDING_LENGTHS.indexOf(length), disabled: onLength === undefined }, { on: { onChange: 'length' } }),
      component('MusicButton', { label: 'Cancel', disabled: onCancel === undefined || !armed }, { on: { onPress: 'cancel' }, slots: { children: ['Cancel'] } }),
    ),
  );
}

/** The callbacks the tree names: the two switches (by index) and Cancel. */
export function landingDialHandlers({ onTarget, onLength, onCancel }: LandingDialProps): Handlers {
  return {
    target: (i: number) => {
      const t = LANDING_TARGETS[i];
      if (t !== undefined) onTarget?.(t);
    },
    length: (i: number) => {
      const n = LANDING_LENGTHS[i];
      if (n !== undefined) onLength?.(n);
    },
    cancel: () => onCancel?.(),
  };
}
