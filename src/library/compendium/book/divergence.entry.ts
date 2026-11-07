// A short chapter built on an argument revealed step by step, with exercises checked by number.
import { cite, exercise, formula, mark, paragraph, peek, section, steps, tex, type Entry } from '../model/document';

export const DIVERGENCE: Entry = {
  id: 'divergence',
  title: 'Divergence',
  kind: 'Concept',
  standing: 'established',
  path: ['Mathematics', 'Analysis'],
  summary:
    'A series diverges when its partial sums have no finite limit. Terms that shrink to zero are not enough to make a series converge: the harmonic series is the standard example.',
  sections: [
    section(
      'Oresme’s grouping',
      paragraph(
        mark('consequence'),
        'The terms of the ',
        peek('harmonic-series', 'harmonic series'),
        ' go to zero, yet the sum grows without bound. Around 1350 Nicole Oresme saw why, by grouping the terms. Walk through it a step at a time.',
        cite('N. Oresme, Quaestiones super geometriam Euclidis (c. 1350).'),
      ),
      steps(
        'Why the harmonic series diverges',
        ['Write the series and keep the first two terms, ', tex('1 + \\tfrac12'), ', as they are.'],
        ['Group the next two terms: ', tex('\\tfrac13 + \\tfrac14 > \\tfrac14 + \\tfrac14 = \\tfrac12'), '.'],
        ['Group the next four: ', tex('\\tfrac15 + \\tfrac16 + \\tfrac17 + \\tfrac18 > 4 \\cdot \\tfrac18 = \\tfrac12'), '.'],
        [
          'In general the ',
          tex('2^k'),
          ' terms from ',
          tex('\\tfrac{1}{2^k + 1}'),
          ' to ',
          tex('\\tfrac{1}{2^{k+1}}'),
          ' are each at least ',
          tex('\\tfrac{1}{2^{k+1}}'),
          ', so the group is at least a half.',
        ],
        ['There are infinitely many groups, each at least a half, so the partial sums pass every bound: the series diverges.'],
      ),
      formula(
        String.raw`1 + \frac{1}{2} + \left(\frac{1}{3} + \frac{1}{4}\right) + \left(\frac{1}{5} + \cdots + \frac{1}{8}\right) + \cdots \ge 1 + \frac{1}{2} + \frac{1}{2} + \frac{1}{2} + \cdots`,
        '1 plus a half plus a third plus a quarter, plus a fifth through an eighth, and so on, is at least 1 plus a half plus a half plus a half and so on',
      ),
    ),
    section(
      'How slowly',
      paragraph(
        mark('consequence'),
        'The grouping also says how slowly it grows: after ',
        tex('2^k'),
        ' terms the sum is at least ',
        tex('1 + \\tfrac{k}{2}'),
        '. The truth is close to that: ',
        tex('H_n'),
        ' grows like ',
        tex('\\ln n + \\gamma'),
        ', with ',
        tex('\\gamma \\approx 0.5772'),
        '.',
      ),
      exercise('past-two', ['How many terms does it take for the partial sum ', tex('H_n'), ' to pass 2?'], {
        check: 'numeric',
        expect: '4',
        placeholder: 'n',
        hint: ['Add the terms one at a time: 1, then 1.5, then 1.833…'],
        solution: [tex('H_3 \\approx 1.833'), ' and ', tex('H_4 \\approx 2.083'), ', so four terms.'],
      }),
      exercise('past-three', ['And to pass 3?'], {
        check: 'numeric',
        expect: '11',
        placeholder: 'n',
        hint: ['The grouping promises it by 16 terms. The actual answer is smaller.'],
        solution: [tex('H_{10} \\approx 2.929'), ' and ', tex('H_{11} \\approx 3.020'), ', so eleven terms.'],
      }),
      exercise('millionth', ['To two decimal places, what is ', tex('H_n'), ' for a million terms? Use ', tex('\\ln n + \\gamma'), '.'], {
        check: 'numeric',
        expect: '14.39',
        tolerance: 0.01,
        placeholder: 'about 14.4',
        solution: [tex('\\ln 10^6 + \\gamma \\approx 13.816 + 0.577 = 14.39'), '.'],
      }),
    ),
  ],
};
