import { exercise, figure, formula, mark, note, paragraph, peek, ref, scrub, section, steps, table, tex, type Entry } from '../../../model/document';

export const RIGHT_TRIANGLES: Entry = {
  id: 'right-triangles',
  title: 'Right triangles',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Trigonometry'],
  summary: 'In a right triangle, the angle decides the shape and the shape decides the ratios of the sides. Sine, cosine and tangent are those ratios, and with them one side and one angle give you the rest.',
  quantities: {
    angle: { value: 35, min: 5, max: 85, step: 1, unit: '°', label: 'Angle' },
    hyp: { value: 2, min: 0.5, max: 3, step: 0.1, label: 'Hypotenuse' },
  },
  sections: [
    section(
      'Same shape, any size',
      paragraph(
        mark('established'),
        'Two triangles with the same angles are the same shape, one a scaled-up copy of the other. Mathematicians call them ',
        peek('similar', 'similar'),
        '. Scale a triangle and every side grows by the same factor, so the ratio of any two sides stays the same.',
      ),
      figure('right-triangle', {}, { angle: 'angle', hypotenuse: 'hyp' }),
      paragraph(
        'Make the long side ',
        scrub('hyp'),
        ' units and watch the three ratios under the figure: they do not move. Now change the angle to ',
        scrub('angle'),
        ' and they all change. In a right triangle the ratios depend on the angle and nothing else.',
      ),
    ),
    section(
      'Three names, three ratios',
      paragraph(
        mark('established'),
        'Pick one of the two sharp angles and call it θ (theta). The longest side, across from the right angle, is the hypotenuse. The side across from θ is the opposite side. The side next to θ that is not the hypotenuse is the adjacent side. Change which angle you mark and opposite and adjacent swap.',
      ),
      paragraph(mark('established'), 'The three ratios get names:'),
      formula(
        String.raw`\sin\theta = \frac{\text{opposite}}{\text{hypotenuse}} \qquad \cos\theta = \frac{\text{adjacent}}{\text{hypotenuse}} \qquad \tan\theta = \frac{\text{opposite}}{\text{adjacent}}`,
        'sine theta is opposite over hypotenuse, cosine theta is adjacent over hypotenuse, tangent theta is opposite over adjacent',
      ),
      paragraph(
        'At ',
        ref('angle', '{}°'),
        ' the figure shows each one as a fraction of two lengths. Sine and cosine can never be more than 1, because the hypotenuse is always the longest side. Tangent can be anything.',
        note('Some people remember the three as SOH CAH TOA: Sine Opposite Hypotenuse, Cosine Adjacent Hypotenuse, Tangent Opposite Adjacent.'),
      ),
    ),
    section(
      'Two triangles worth knowing',
      paragraph(
        mark('consequence'),
        'Cut an equilateral triangle with sides 2 in half and you get a right triangle with angles 30°, 60° and 90° and sides 1, √3 and 2. Cut a square with sides 1 along its diagonal and you get one with angles 45°, 45° and 90° and sides 1, 1 and √2. Their ratios come out exactly:',
      ),
      table(
        'The special triangles',
        [['θ'], [tex(String.raw`\sin\theta`)], [tex(String.raw`\cos\theta`)], [tex(String.raw`\tan\theta`)]],
        [
          [['30°'], [tex(String.raw`\frac{1}{2}`)], [tex(String.raw`\frac{\sqrt3}{2}`)], [tex(String.raw`\frac{\sqrt3}{3}`)]],
          [['45°'], [tex(String.raw`\frac{\sqrt2}{2}`)], [tex(String.raw`\frac{\sqrt2}{2}`)], [tex('1')]],
          [['60°'], [tex(String.raw`\frac{\sqrt3}{2}`)], [tex(String.raw`\frac{1}{2}`)], [tex(String.raw`\sqrt3`)]],
        ],
        { rowHeads: true },
      ),
      paragraph('Use the buttons under the figure to land on each of them and read the ratios off.'),
    ),
    section(
      'Solving a triangle',
      paragraph(
        mark('established'),
        'Knowing one side and one sharp angle of a right triangle is enough to find everything else. Choose the ratio that links the side you know to the side you want.',
      ),
      steps(
        'A ladder against a wall',
        ['A 4 m ladder leans against a wall, making 70° with the ground. How high up the wall does it reach?'],
        ['The ladder is the hypotenuse. The height is opposite the 70° angle. The ratio linking opposite and hypotenuse is sine.'],
        [tex(String.raw`\sin 70^\circ = \frac{h}{4}`), ', so ', tex(String.raw`h = 4\sin 70^\circ \approx 3.76`), ' m.'],
      ),
      exercise('sin-60', ['What is the exact value of ', tex(String.raw`\sin 60^\circ`), '? Use sqrt( ) for a square root.'], {
        answer: { kind: 'typed', check: 'expression', expect: 'sqrt(3)/2', placeholder: 'e.g. sqrt(2)/2' },
        hint: ['The 30-60-90 triangle has sides 1, √3 and 2. Which is opposite 60°?'],
        solution: ['Opposite 60° is √3 and the hypotenuse is 2, so ', tex(String.raw`\sin 60^\circ = \frac{\sqrt3}{2}`), '.'],
      }),
      exercise('ramp', ['A ramp rises 1.5 m over a slope 6 m long. What angle does it make with the ground, to the nearest tenth of a degree?'], {
        check: 'numeric',
        expect: '14.5',
        tolerance: 0.1,
        placeholder: 'degrees',
        hint: ['The rise is opposite the angle; the slope is the hypotenuse. Then undo the sine with sin⁻¹ on a calculator.'],
        solution: [tex(String.raw`\sin\theta = \frac{1.5}{6} = 0.25`), ', so ', tex(String.raw`\theta = \sin^{-1} 0.25 \approx 14.5^\circ`), '.'],
      }),
    ),
  ],
};
