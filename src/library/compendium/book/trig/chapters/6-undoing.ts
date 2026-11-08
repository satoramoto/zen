import { exercise, figure, formula, mark, paragraph, peek, ref, scrub, section, target, tex, type Entry } from '../../../model/document';

export const UNDOING: Entry = {
  id: 'undoing',
  title: 'Undoing',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Trigonometry'],
  summary: 'Knowing the sine and wanting the angle is asking the question backwards. There are many answers; this chapter picks the one your calculator gives, and then finds all the others.',
  quantities: {
    k: { value: 0.5, min: -1, max: 1, step: 0.05, label: 'k' },
    theta: { value: 30, min: 0, max: 360, step: 1, unit: '°', label: 'θ' },
  },
  sections: [
    section(
      'Asking backwards',
      paragraph(
        mark('established'),
        'So far the angle came first and the sine followed. Turn it round: which angles have a sine of one half? On the unit circle, sine is height, so draw a flat line at that height and see where it crosses the circle.',
      ),
      figure('unit-circle', {}, { angle: 'theta', guideSin: 'k' }),
      paragraph(
        'Move the line to height k = ',
        scrub('k'),
        '. It crosses the circle twice, once on each side, until k reaches 1 or −1, where the two crossings meet, and past that there is no angle at all. Drag the point onto each crossing. The figure reads θ = ',
        ref('theta', '{}°'),
        '.',
      ),
      paragraph(
        mark('consequence'),
        'And it is worse than two: every whole turn added to an answer is another answer. The equation has infinitely many solutions.',
      ),
    ),
    section(
      'One answer, on purpose',
      paragraph(
        mark('established'),
        'A machine that undoes sine has to give one answer, so we agree which. Sine is cut down to the stretch from −90° to 90°, where every height comes up exactly once. On that stretch it has an ',
        peek('inverse-function', 'inverse'),
        ', written arcsin or ',
        tex(String.raw`\sin^{-1}`),
        '. Its graph is sine’s graph on that stretch, reflected in the line y = x.',
      ),
      figure('wave-graph', { inverse: true, kind: 'sin' }),
      paragraph(
        mark('established'),
        'Cosine is cut down to 0° to 180° instead, because that is where it takes each value once. Tangent uses −90° to 90°, like sine.',
      ),
      formula(
        String.raw`\sin^{-1}: [-1, 1] \to \left[-\tfrac{\pi}{2}, \tfrac{\pi}{2}\right] \qquad \cos^{-1}: [-1, 1] \to [0, \pi] \qquad \tan^{-1}: \mathbb{R} \to \left(-\tfrac{\pi}{2}, \tfrac{\pi}{2}\right)`,
        'arcsine takes minus 1 to 1 into minus pi over 2 to pi over 2; arccosine into 0 to pi; arctangent takes every number into minus pi over 2 to pi over 2',
      ),
    ),
    section(
      'Every answer on an interval',
      paragraph(
        mark('consequence'),
        'The calculator’s answer is one crossing. The circle gives the other: for sine, the mirror image across the y-axis, 180° minus the first. Then add whole turns. To solve on 0° to 360°:',
      ),
      formula(String.raw`\sin\theta = k \;\Rightarrow\; \theta = \sin^{-1}k \;\text{ or }\; 180^\circ - \sin^{-1}k, \quad \text{plus any multiple of } 360^\circ`, 'sine theta equals k gives theta equals arcsine k or 180 degrees minus arcsine k, plus any multiple of 360 degrees'),
      target('second-solution', ['Set the line to ', tex(String.raw`k = \tfrac12`), ' and drag the point to the solution that is not 30°, then check.'], {
        quantity: 'theta',
        expect: 150,
        tolerance: 2,
        hint: ['The other crossing is on the left of the circle, at the same height.'],
        solution: ['180° − 30° = 150°.'],
      }),
      exercise('arcsin-half', ['What does a calculator give for ', tex(String.raw`\sin^{-1}(0.5)`), ' in degrees?'], {
        check: 'numeric',
        expect: '30',
        tolerance: 0.01,
        placeholder: 'degrees',
        hint: ['It gives the answer between −90° and 90°.'],
        solution: ['30°, because sin 30° = ½ and 30° is in the agreed stretch.'],
      }),
      exercise('arccos-minus-one', ['What is ', tex(String.raw`\cos^{-1}(-1)`), ' in radians? Write pi for π.'], {
        answer: { kind: 'typed', check: 'expression', expect: 'pi', placeholder: 'e.g. pi/2' },
        hint: ['Where on the unit circle is the reach −1?'],
        solution: ['Straight left, at half a turn: ', tex(String.raw`\pi`), '.'],
      }),
    ),
  ],
};
