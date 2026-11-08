import { choice, exercise, figure, formula, mark, paragraph, peek, ref, scrub, section, table, target, tex, type Entry } from '../../../model/document';

export const UNIT_CIRCLE: Entry = {
  id: 'unit-circle',
  title: 'The unit circle',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Trigonometry'],
  summary: 'A right triangle can’t have an angle of 150°, so sine and cosine need a better home. Put the triangle inside a circle of radius 1 and they become the coordinates of a point, for every angle there is.',
  quantities: { theta: { value: 30, min: 0, max: 360, step: 1, unit: '°', label: 'θ' } },
  sections: [
    section(
      'Beyond ninety degrees',
      paragraph(
        mark('established'),
        'In a right triangle the other two angles are both less than 90°. So the ratios of the last chapter say nothing about 120° or 300°. The fix is to stand the triangle inside a circle of radius 1, centred on the origin, with its hypotenuse as a radius.',
      ),
      figure('unit-circle', {}, { angle: 'theta' }),
      paragraph(
        'Drag the point, or set θ to ',
        scrub('theta'),
        '. The hypotenuse is always 1, so the opposite side is just its own length, and the adjacent side too. Sine is how far up the point is. Cosine is how far across.',
      ),
    ),
    section(
      'Sine and cosine as a point',
      paragraph(
        mark('established'),
        'That gives a definition that works for any angle at all: walk round the unit circle by the angle θ from standard position, and the point you land on is',
      ),
      formula(String.raw`(\cos\theta,\ \sin\theta), \qquad \tan\theta = \frac{\sin\theta}{\cos\theta}`, 'the point cos theta, sin theta; tangent theta is sine over cosine'),
      paragraph(
        mark('consequence'),
        'Between 0° and 90° it agrees with the triangle ratios. Past 90° the point keeps going, and sine and cosine simply carry on being its coordinates, negative where the point is left of or below the centre. Tangent is undefined at 90° and 270°, where cosine is 0.',
      ),
    ),
    section(
      'Signs by quadrant',
      paragraph(
        'At ',
        ref('theta', '{}°'),
        ' the caption under the figure tells you the quadrant and the signs. Go round once and fill in this table in your head before reading it:',
      ),
      table(
        'Which are positive where',
        [['Quadrant'], ['Angles'], [tex(String.raw`\sin`)], [tex(String.raw`\cos`)], [tex(String.raw`\tan`)]],
        [
          [['I'], ['0° to 90°'], ['+'], ['+'], ['+']],
          [['II'], ['90° to 180°'], ['+'], ['−'], ['−']],
          [['III'], ['180° to 270°'], ['−'], ['−'], ['+']],
          [['IV'], ['270° to 360°'], ['−'], ['+'], ['−']],
        ],
        { rowHeads: true },
      ),
    ),
    section(
      'Reference angles',
      paragraph(
        mark('consequence'),
        'Put θ at 150°, then at 30°. The triangle is the same shape, flipped over the y-axis: same height, opposite reach. Every angle has a ',
        peek('reference-angle', 'reference angle'),
        ', the sharp angle between it and the x-axis. Its sine and cosine are the values at the reference angle, with the signs of its quadrant.',
      ),
      paragraph(
        'So you only need to know the first quadrant. The table below, with the signs from the one above, covers every special angle round the whole circle.',
      ),
      table(
        'The special angles',
        [['θ'], [tex(String.raw`\sin\theta`)], [tex(String.raw`\cos\theta`)]],
        [
          [['0°'], [tex('0')], [tex('1')]],
          [['30°'], [tex(String.raw`\frac{1}{2}`)], [tex(String.raw`\frac{\sqrt3}{2}`)]],
          [['45°'], [tex(String.raw`\frac{\sqrt2}{2}`)], [tex(String.raw`\frac{\sqrt2}{2}`)]],
          [['60°'], [tex(String.raw`\frac{\sqrt3}{2}`)], [tex(String.raw`\frac{1}{2}`)]],
          [['90°'], [tex('1')], [tex('0')]],
        ],
        { rowHeads: true },
      ),
      target('half-up', ['Drag the point to an angle in quadrant II where ', tex(String.raw`\sin\theta = \tfrac12`), ', then check.'], {
        quantity: 'theta',
        expect: 150,
        tolerance: 2,
        hint: ['Half way up the circle. In quadrant II the point is on the left.'],
        solution: ['The reference angle is 30°, so in quadrant II the angle is 180° − 30° = 150°.'],
      }),
      choice('tan-sign', ['In quadrant II, tangent is'], {
        options: [
          { id: 'pos', prompt: ['positive'] },
          { id: 'neg', prompt: ['negative'] },
          { id: 'zero', prompt: ['always zero'] },
        ],
        expect: 'neg',
        hint: ['Tangent is sine divided by cosine. What are their signs in quadrant II?'],
        solution: ['Sine is positive and cosine negative, so their quotient is negative.'],
      }),
      exercise('cos-150', ['What is the exact value of ', tex(String.raw`\cos 150^\circ`), '?'], {
        answer: { kind: 'typed', check: 'expression', expect: '-sqrt(3)/2', placeholder: 'e.g. -sqrt(2)/2' },
        hint: ['Reference angle 30°. Is the point left or right of the centre?'],
        solution: [tex(String.raw`\cos 30^\circ = \frac{\sqrt3}{2}`), ', and in quadrant II cosine is negative: ', tex(String.raw`-\frac{\sqrt3}{2}`), '.'],
      }),
    ),
  ],
};
