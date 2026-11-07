// The entry "The harmonic series" as data: the sample book's first chapter. Short and
// meant to be accurate; the Lean names are plausible Mathlib names, marked as sample.
import { LEAN_SAMPLE, PROOF, TIMELINE, TIMELINE_AXIS } from './harmonic.sample';
import { cite, code, figure, formula, mark, note, paragraph, peek, proof, section, tex, timeline, type Entry } from '../model/document';

export const HARMONIC: Entry = {
  id: 'harmonic-series',
  title: 'The harmonic series',
  kind: 'Concept',
  standing: 'established',
  path: ['Mathematics', 'Acoustics'],
  summary:
    'Add the reciprocals of the counting numbers and the sum never settles. The same numbers describe how a string vibrates, which is how the series got its name.',
  sections: [
    section(
      'The series',
      paragraph(mark('consequence'), 'The harmonic series adds the reciprocals of the counting numbers, and its sum is infinite:'),
      formula(
        String.raw`\sum_{n=1}^{\infty} \frac{1}{n} = 1 + \frac{1}{2} + \frac{1}{3} + \frac{1}{4} + \cdots = \infty`,
        'The sum over n from 1 to infinity of 1 over n equals 1 plus a half plus a third plus a quarter and so on, which is infinite',
      ),
      paragraph(
        mark('consequence'),
        'It gets there slowly. The sum of the first ',
        tex('n'),
        ' terms, ',
        tex('H_n'),
        ', grows like ',
        tex(String.raw`\ln n + \gamma`),
        ', where ',
        tex(String.raw`\gamma \approx 0.5772`),
        ' is the Euler–Mascheroni constant: a million terms add up to only about 14.39.',
        note('Euler showed in 1734 that H(n) − ln n tends to a constant, and computed it to several places.'),
      ),
      paragraph(
        mark('conjecture'),
        'The partial sums even reach the Riemann hypothesis. Lagarias showed it is equivalent to ',
        tex(String.raw`\sigma(n) \le H_n + e^{H_n} \ln H_n`),
        ' for every ',
        tex(String.raw`n \ge 1`),
        ', where σ(n) is the sum of the divisors of n. Whether the inequality always holds is open.',
        cite('J. C. Lagarias, “An elementary problem equivalent to the Riemann hypothesis”, American Mathematical Monthly 109 (2002).'),
      ),
    ),
    section(
      'Why “harmonic”',
      paragraph(
        mark('established'),
        'A string fixed at both ends can vibrate only in modes that fit a whole number of half-waves along it. Mode ',
        tex('n'),
        ' has wavelength ',
        tex(String.raw`\lambda_n = \frac{2L}{n}`),
        ' and frequency ',
        tex('f_n = n f_1'),
        ': the ',
        peek('overtones', 'overtones'),
        ' of an ideal string are whole multiples of its fundamental. ',
        mark('interpretation'),
        'Its wavelengths, 1, 1/2, 1/3, … of the fundamental’s, are the terms of the series, and that is where the name is usually traced.',
        cite('J. Sauveur, “Système général des intervalles des sons”, Mémoires de l’Académie royale des sciences (1701), where the overtones are first called harmoniques.'),
      ),
      figure('harmonic-string', { number: 'Figure 1' }),
    ),
    section(
      'Intervals from ratios',
      paragraph(
        mark('established'),
        'Neighbouring harmonics make the consonances: 2:1 is the octave, 3:2 the fifth, 4:3 the fourth, 5:4 the major third. ',
        peek('pythagorean'),
        ' builds a whole scale from the first two. The story that Pythagoras found the ratios in a smithy’s hammers is a legend.',
        cite('Nicomachus of Gerasa, Manual of Harmonics (2nd century CE); Boethius retells it in De institutione musica.'),
      ),
      paragraph(
        mark('interpretation'),
        'Rameau made the sounding body and its harmonics the ground of harmony itself, reading the major triad off harmonics 4, 5 and 6.',
        cite('J.-P. Rameau, Traité de l’harmonie (1722); the argument from the corps sonore is worked out in Génération harmonique (1737).'),
        ' ',
        mark('speculation'),
        'One suggestion for why small ratios sound consonant at all is that the ear learns harmonic templates from voices, whose spectra are harmonic.',
      ),
    ),
    section(
      'Oresme’s proof',
      paragraph(
        mark('consequence'),
        'Around 1350 Nicole Oresme showed the sum is infinite by grouping its terms: after the first two, take the next two, then the next four, then the next eight. Each group comes to at least a half, and there are infinitely many groups, so the partial sums pass every bound: the series ',
        peek('divergence', 'diverges'),
        '.',
        cite('N. Oresme, Quaestiones super geometriam Euclidis (c. 1350). Mengoli (1647) and the Bernoullis (1689) later gave other proofs.'),
      ),
      formula(
        String.raw`1 + \frac{1}{2} + \left(\frac{1}{3} + \frac{1}{4}\right) + \left(\frac{1}{5} + \cdots + \frac{1}{8}\right) + \cdots \ge 1 + \frac{1}{2} + \frac{1}{2} + \frac{1}{2} + \cdots`,
        '1 plus a half plus a third plus a quarter, plus a fifth through an eighth, and so on, is at least 1 plus a half plus a half plus a half and so on',
      ),
    ),
    section(
      'In Lean',
      paragraph(
        'The same fact as a formal statement. The graph shows what its proof rests on. ',
        mark('interpretation'),
        'Cauchy condensation, at the bottom, is Oresme’s grouping made general.',
      ),
      code(LEAN_SAMPLE, { language: 'lean', tag: 'Sample' }),
      proof(PROOF, 'What the Lean proof of divergence depends on'),
    ),
    section(
      'History',
      timeline(
        TIMELINE,
        TIMELINE_AXIS,
        'People and works in the history of the harmonic series',
        'Lives as bars (lighter where the dates are approximate), works as dots. The axis breaks between antiquity and 1300.',
      ),
    ),
  ],
};
