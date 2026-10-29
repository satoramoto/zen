// StemLanes' forms (docs/live-workspace.md, lane 5; docs/assembly.md): what the deck faceplate
// needs and the sizes each form draws with, in scale units read from StemLanes.css. Framework-free:
// `StemLanes.tsx` reads the chosen form with `useForm`, `StemLanes.svelte` with `getForm`.
import { lengthMax, lengthSum } from '../../../layout/assembly/units';
import type { Forms, Length } from '../../../layout/assembly/types';

/** The three sizes the same deck is drawn at, most room first. */
export type StemLanesForm = 'four' | 'stacked' | 'one';

/** The forms in order, for a story or a parent that names one. */
export const STEM_LANES_FORM_IDS = ['four', 'stacked', 'one'] as const satisfies readonly StemLanesForm[];

/**
 * The row's least width: the hue mark, the name, `peaks` control heights of envelope and the M / S
 * pair (four control heights of keys), plus the grid's gaps (`--yh-stem-gap`, a `--space-1` each,
 * six of them for four columns and three gaps).
 */
const laneW = (name: number, peaks: number): Length =>
  lengthSum({ control: 1 + name + peaks + 4 }, { space: [1, 1, 1, 1, 1, 1] });

/**
 * The deck's forms. Each form's height is exact (a lane is a fixed height in its form, so the deck
 * never claims room it won't use) and its width grows: `grow: { w: true }`.
 */
export const STEM_LANES_FORMS: Forms<StemLanesForm> = [
  {
    // Every lane, a full-height ruler with cue labels: the deck as it sits on a screen with room.
    id: 'four',
    min: { w: laneW(2.5, 6), h: { control: 6, space: [2, 2, 1, 1, 1, 1] } },
    ideal: { w: lengthMax(laneW(2.5, 12), { control: 30 }), h: { control: 6, space: [2, 2, 1, 1, 1, 1] } },
    grow: { w: true },
  },
  {
    // Every lane, thinner, the ruler shorter and the cue flags without their labels: the deck in
    // a narrow column or a 900 px frame, where the envelope still carries the shape.
    id: 'stacked',
    min: { w: laneW(2.5, 6), h: { control: 4.05, space: [1, 1, 1, 1, 1, 1] } },
    ideal: { w: lengthMax(laneW(2.5, 10), { control: 24 }), h: { control: 4.05, space: [1, 1, 1, 1, 1, 1] } },
    grow: { w: true },
  },
  {
    // The selected stem alone, taller, the ruler kept: the deck zoomed on one part.
    id: 'one',
    min: { w: laneW(3.5, 6), h: { control: 2.8, space: [3, 3, 2] } },
    ideal: { w: lengthMax(laneW(3.5, 14), { control: 24 }), h: { control: 2.8, space: [3, 3, 2] } },
    grow: { w: true },
  },
];

/** One form's lengths, as the CSS custom properties the model sets on the root. */
export interface StemLanesSize {
  /** The shared ruler's height. */
  ruler: string;
  /** One lane's height. */
  lane: string;
  /** The hue mark's width. */
  mark: string;
  /** The name column's width. */
  name: string;
  /** The M / S pair's column width. */
  keys: string;
  /** The plate's inset. */
  pad: string;
  /** Between the ruler, the lanes and their columns. */
  gap: string;
}

/**
 * The lengths each form's needs were counted from. `--space-N` and `--control-h` are the scale's,
 * so a denser pack draws a smaller deck without the numbers changing.
 */
export const STEM_LANES_SIZE: Record<StemLanesForm, StemLanesSize> = {
  four: {
    ruler: 'var(--control-h)',
    lane: 'calc(var(--control-h) * 1.25)',
    mark: 'var(--space-1)',
    name: 'calc(var(--space-6) * 1.5)',
    keys: 'calc(var(--control-h) * 4)',
    pad: 'var(--space-2)',
    gap: 'var(--space-1)',
  },
  stacked: {
    ruler: 'calc(var(--control-h) * 0.6)',
    lane: 'calc(var(--control-h) - var(--space-1))',
    mark: 'var(--space-1)',
    name: 'calc(var(--space-6) * 1.5)',
    keys: 'calc(var(--control-h) * 4)',
    pad: 'var(--space-1)',
    gap: 'var(--space-1)',
  },
  one: {
    ruler: 'var(--control-h)',
    lane: 'calc(var(--control-h) * 1.8)',
    mark: 'var(--space-1)',
    name: 'calc(var(--space-6) * 2)',
    keys: 'calc(var(--control-h) * 4)',
    pad: 'var(--space-3)',
    gap: 'var(--space-2)',
  },
};
