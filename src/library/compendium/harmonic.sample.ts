// Sample content for the Compendium mockup's entry "The harmonic series". Short and meant to be
// accurate; the Lean names are plausible Mathlib names, marked as sample, not checked against a
// pinned Mathlib.

import type { PeekEntry } from './Peek';
import type { ProofGraphData } from './ProofGraph';
import type { AxisPiece, TimelineRow } from './Timeline';

export const PEEKS = {
  overtone: {
    title: 'Overtone',
    kind: 'Concept',
    standing: 'established',
    summary:
      'Any frequency a vibrating body sounds above its lowest. For an ideal string the overtones are whole-number multiples of the fundamental: the harmonics.',
  },
  pythagorean: {
    title: 'Pythagorean tuning',
    kind: 'Tuning system',
    standing: 'established',
    summary:
      'A tuning built from the ratios 2:1 and 3:2 alone: stack pure fifths and fold them into one octave. Twelve fifths overshoot seven octaves by the Pythagorean comma, about 23.5 cents.',
  },
  divergence: {
    title: 'Divergence',
    kind: 'Concept',
    standing: 'established',
    summary:
      'A series diverges when its partial sums have no finite limit. Terms that shrink to zero are not enough to make a series converge: the harmonic series is the standard example.',
  },
} satisfies Record<string, PeekEntry>;

/** The interval a harmonic makes over the one below it, n:(n − 1). */
const STEP_INTERVAL: Record<number, string> = {
  2: 'an octave',
  3: 'a perfect fifth',
  4: 'a perfect fourth',
  5: 'a just major third',
  6: 'a just minor third',
  7: 'a septimal minor third',
  8: 'a septimal whole tone',
};

const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/** What the figure says about harmonic `n` of a string whose fundamental is `f1` Hz (an A). */
export function harmonicFacts(n: number, f1: number) {
  const cents = 1200 * Math.log2(n);
  const semis = Math.round(cents / 100);
  const off = Math.round(cents - semis * 100);
  const midi = 45 + semis; // f1 = 110 Hz is MIDI 45
  const note = NOTE[midi % 12];
  const offText = off === 0 ? 'in tune with equal temperament' : `${off > 0 ? '+' : '−'}${Math.abs(off)} cents from equal temperament`;
  const changes =
    n === 1
      ? `n = 1: the whole string in one loop, no nodes between the ends; ${f1} Hz (${note}), the fundamental.`
      : `n = ${n}: ${n} loops, ${n - 1} node${n - 1 === 1 ? '' : 's'} between the ends; ${n * f1} Hz, nearest ${note}, ${offText}; ${n}:${n - 1} over harmonic ${n - 1}, ${STEP_INTERVAL[n]}.`;
  return { midi, note, cents: off, changes };
}

export const LEAN_SAMPLE = `-- Sample: a plausible Mathlib name, not checked against a pinned Mathlib.
open Filter in
theorem harmonic_diverges :
    Tendsto (fun n : ℕ => ∑ i ∈ Finset.range n, (1 / (i + 1) : ℝ)) atTop atTop :=
  Real.tendsto_sum_range_one_div_nat_succ_atTop`;

export const PROOF: ProofGraphData = {
  nodes: [
    {
      id: 'goal',
      name: 'Real.tendsto_sum_range_one_div_nat_succ_atTop',
      says: 'The partial sums 1 + 1/2 + … + 1/n grow without bound.',
      kind: 'theorem',
    },
    { id: 'natcast', name: 'Real.not_summable_one_div_natCast', says: 'The series of 1/n has no finite sum.', kind: 'lemma' },
    { id: 'pseries', name: 'Real.summable_one_div_nat_rpow', says: 'The p-series of 1/nᵖ converges exactly when p > 1.', kind: 'lemma' },
    { id: 'rpow', name: 'Real.summable_nat_rpow_inv', says: 'The same, written with n^(−p).', kind: 'lemma' },
    {
      id: 'condense',
      name: 'summable_condensed_iff_of_nonneg',
      says: 'Cauchy condensation: Σ f(n) converges iff Σ 2ᵏ f(2ᵏ) does. Oresme’s grouping, made general.',
      kind: 'lemma',
    },
    { id: 'geom', name: 'summable_geometric_iff_norm_lt_one', says: 'A geometric series converges exactly when |r| < 1.', kind: 'lemma' },
    {
      id: 'iff',
      name: 'not_summable_iff_tendsto_nat_atTop_of_nonneg',
      says: 'For terms ≥ 0: no finite sum exactly when the partial sums go to infinity.',
      kind: 'lemma',
    },
  ],
  edges: [
    ['natcast', 'goal'],
    ['iff', 'goal'],
    ['pseries', 'natcast'],
    ['rpow', 'pseries'],
    ['condense', 'rpow'],
    ['geom', 'rpow'],
  ],
};

export const TIMELINE_AXIS: AxisPiece[] = [
  { from: -600, to: -450, ticks: [-600, -500] },
  { from: 1300, to: 1850, ticks: [1300, 1400, 1500, 1600, 1700, 1800] },
];

export const TIMELINE: TimelineRow[] = [
  { id: 'pythagoras', label: 'Pythagoras', span: { from: -570, to: -495, circa: true }, points: [{ at: -530, label: 'ratios 2:1, 3:2 (attributed)', circa: true }] },
  { id: 'oresme', label: 'Nicole Oresme', span: { from: 1320, to: 1382, circa: true }, points: [{ at: 1350, label: 'divergence by grouping', circa: true }] },
  { id: 'mersenne', label: 'Marin Mersenne', span: { from: 1588, to: 1648 }, points: [{ at: 1636, label: 'Harmonie universelle' }] },
  { id: 'sauveur', label: 'Joseph Sauveur', span: { from: 1653, to: 1716 }, points: [{ at: 1701, label: 'names the harmonics' }] },
  { id: 'rameau', label: 'J.-P. Rameau', span: { from: 1683, to: 1764 }, points: [{ at: 1722, label: 'Traité de l’harmonie' }] },
  { id: 'fourier', label: 'Joseph Fourier', span: { from: 1768, to: 1830 }, points: [{ at: 1822, label: 'Théorie analytique de la chaleur' }] },
];
