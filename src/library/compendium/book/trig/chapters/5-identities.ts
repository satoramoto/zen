import { choice, exercise, figure, formula, mark, paragraph, peek, ref, scrub, section, steps, tex, type Entry } from '../../../model/document';

export const IDENTITIES: Entry = {
  id: 'identities',
  title: 'Identities',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Trigonometry'],
  summary: 'Some equations between sines and cosines are true at every angle. You can see why in a picture, and once you trust them you can swap one expression for an easier one.',
  quantities: {
    angle: { value: 35, min: 0, max: 90, step: 1, unit: '°', label: 'θ' },
    alpha: { value: 35, min: 5, max: 60, step: 1, unit: '°', label: 'α' },
    beta: { value: 25, min: 5, max: 60, step: 1, unit: '°', label: 'β' },
  },
  sections: [
    section(
      'Always one',
      paragraph(
        mark('established'),
        'Go back to the triangle in the unit circle. Its hypotenuse is 1, its upright side is the sine and its flat side is the cosine. Build a square on each of the two short sides.',
      ),
      figure('identity-squares', {}, { angle: 'angle' }),
      paragraph(
        'Drag the point, or set θ to ',
        scrub('angle'),
        '. One square grows as the other shrinks, and the two areas always add up to exactly 1, the area of the square on the hypotenuse. That is Pythagoras’ theorem, and here it says:',
      ),
      formula(String.raw`\sin^2\theta + \cos^2\theta = 1`, 'sine squared theta plus cosine squared theta equals 1'),
      paragraph(
        mark('established'),
        'An equation that holds for every angle is called an ',
        peek('identity', 'identity'),
        '. This one is the most used in the subject. Written as ',
        tex(String.raw`\cos^2\theta = 1 - \sin^2\theta`),
        ' it turns any cosine squared into sines.',
      ),
    ),
    section(
      'Cofunctions',
      paragraph(
        mark('consequence'),
        'The two sharp angles of a right triangle add up to 90°. What is opposite one is adjacent to the other. So the sine of one angle is the cosine of the other: at θ = ',
        ref('angle', '{}°'),
        ' the other angle is 90° minus that.',
      ),
      formula(String.raw`\sin(90^\circ - \theta) = \cos\theta \qquad \cos(90^\circ - \theta) = \sin\theta`, 'sine of 90 degrees minus theta is cosine theta, and the other way round'),
      paragraph('That is where the co in cosine comes from: the sine of the complementary angle.'),
    ),
    section(
      'Adding angles',
      paragraph(
        mark('established'),
        'Is the sine of 30° + 45° the sine of 30° plus the sine of 45°? Try it: that would be about 1.2, more than 1, which no sine can be. The real rule is more interesting, and this picture builds it.',
      ),
      figure('angle-sum', {}, { alpha: 'alpha', beta: 'beta' }),
      paragraph(
        'Set α to ',
        scrub('alpha'),
        ' and β to ',
        scrub('beta'),
        '. The tip of the unit-length side is at height sin(α + β). That height splits into two stacked pieces, one from each triangle, and the bar beside the figure shows them adding up.',
      ),
      formula(
        String.raw`\sin(\alpha + \beta) = \sin\alpha\cos\beta + \cos\alpha\sin\beta \qquad \cos(\alpha + \beta) = \cos\alpha\cos\beta - \sin\alpha\sin\beta`,
        'sine of alpha plus beta is sine alpha cosine beta plus cosine alpha sine beta; cosine of alpha plus beta is cosine alpha cosine beta minus sine alpha sine beta',
      ),
    ),
    section(
      'Double angles',
      paragraph(
        mark('consequence'),
        'Set β equal to α and the sum rules become rules for twice an angle:',
      ),
      formula(String.raw`\sin 2\alpha = 2\sin\alpha\cos\alpha \qquad \cos 2\alpha = \cos^2\alpha - \sin^2\alpha`, 'sine 2 alpha is 2 sine alpha cosine alpha; cosine 2 alpha is cosine squared minus sine squared'),
      steps(
        'Sine of 75° exactly',
        ['75° is 30° + 45°, two angles whose sines and cosines we know.'],
        [tex(String.raw`\sin 75^\circ = \sin 30^\circ \cos 45^\circ + \cos 30^\circ \sin 45^\circ = \tfrac12 \cdot \tfrac{\sqrt2}{2} + \tfrac{\sqrt3}{2}\cdot\tfrac{\sqrt2}{2}`)],
        ['That is ', tex(String.raw`\frac{\sqrt2 + \sqrt6}{4} \approx 0.966`), '. Set α to 30 and β to 45 in the figure and read it off.'],
      ),
      exercise('cos-squared', ['Write ', tex(String.raw`\cos^2 x`), ' using only sines. Use x, and write powers with ^.'], {
        answer: { kind: 'typed', check: 'expression', expect: '1 - sin(x)^2', placeholder: 'e.g. 2*sin(x)^2', options: { variable: 'x' } },
        hint: ['Start from sin²x + cos²x = 1.'],
        solution: [tex(String.raw`\cos^2 x = 1 - \sin^2 x`), '.'],
      }),
      choice('cofunction', ['Which is equal to ', tex(String.raw`\sin(90^\circ - \theta)`), '?'], {
        options: [
          { id: 'sin', prompt: [tex(String.raw`\sin\theta`)] },
          { id: 'cos', prompt: [tex(String.raw`\cos\theta`)] },
          { id: 'neg', prompt: [tex(String.raw`-\sin\theta`)] },
        ],
        expect: 'cos',
        hint: ['In a right triangle, the other sharp angle is 90° − θ.'],
        solution: ['The side opposite 90° − θ is the side adjacent to θ, so it is cos θ.'],
      }),
      exercise('sin-75', ['To three decimal places, what is ', tex(String.raw`\sin 75^\circ`), '?'], {
        check: 'numeric',
        expect: '0.966',
        tolerance: 0.001,
        placeholder: 'a decimal',
        hint: ['Use the steps above, or the figure with α = 30 and β = 45.'],
        solution: [tex(String.raw`\frac{\sqrt2 + \sqrt6}{4} \approx 0.966`), '.'],
      }),
    ),
  ],
};
