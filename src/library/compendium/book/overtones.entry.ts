// A short chapter that leans on the page's quantities: a scrub in the text and the figure bound
// to it hold the same harmonic.
import { exercise, figure, formula, mark, paragraph, peek, ref, scrub, section, tex, type Entry } from '../model/document';

export const OVERTONES: Entry = {
  id: 'overtones',
  title: 'Overtones',
  kind: 'Concept',
  standing: 'established',
  path: ['Mathematics', 'Acoustics'],
  summary:
    'Any frequency a vibrating body sounds above its lowest. For an ideal string the overtones are whole-number multiples of the fundamental: the harmonics.',
  quantities: {
    n: { value: 3, min: 1, max: 8, step: 1, label: 'Harmonic n' },
  },
  sections: [
    section(
      'Modes of a string',
      paragraph(
        mark('established'),
        'A string fixed at both ends can only vibrate in shapes that are still at both ends. The simplest is one loop; the next fits two loops, then three, and so on. Try it: mode ',
        scrub('n'),
        ' has ',
        ref('n', '{} loops'),
        ' and the figure below follows. Drag the number, or focus it and use the arrow keys.',
      ),
      figure('harmonic-string', { number: 'Figure 1' }, { harmonic: 'n' }),
      paragraph(
        mark('consequence'),
        'Mode ',
        tex('n'),
        ' has wavelength ',
        tex(String.raw`\lambda_n = \frac{2L}{n}`),
        ' and frequency ',
        tex('f_n = n f_1'),
        '. Each overtone is a whole multiple of the fundamental, which is why the ',
        peek('harmonic-series', 'harmonic series'),
        ' carries the name: its terms are the wavelengths, 1, 1/2, 1/3, … of the fundamental’s.',
      ),
      formula(String.raw`f_n = n f_1, \qquad \lambda_n = \frac{\lambda_1}{n}`, 'f sub n equals n times f sub 1, and lambda sub n equals lambda sub 1 over n'),
    ),
    section(
      'Check yourself',
      exercise('nodes', ['Mode ', tex('n'), ' of a string has how many nodes strictly between its ends, for ', tex('n = 5'), '?'], {
        check: 'numeric',
        expect: '4',
        placeholder: 'a whole number',
        hint: ['Count the still points in the figure for mode 5: every loop ends in one, except that the ends themselves don’t count.'],
        solution: ['Mode ', tex('n'), ' has ', tex('n'), ' loops and ', tex('n - 1'), ' nodes between the ends: for ', tex('n = 5'), ', four.'],
      }),
      exercise('interval', ['Harmonics 3 and 2 sound together. What interval do they make?'], {
        check: 'exact',
        expect: 'perfect fifth|a perfect fifth|fifth|a fifth',
        placeholder: 'the interval’s name',
        hint: ['Their frequencies are in the ratio 3:2.'],
        solution: ['3:2 is the perfect fifth: play harmonic 3 with harmonic 2 in the figure.'],
      }),
    ),
  ],
};
