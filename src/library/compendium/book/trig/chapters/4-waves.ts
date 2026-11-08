import { exercise, figure, formula, mark, note, paragraph, peek, ref, scrub, section, target, tex, type Entry } from '../../../model/document';

export const WAVES: Entry = {
  id: 'waves',
  title: 'Waves',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Trigonometry'],
  summary: 'Go round the unit circle and plot the height against how far you have turned: you get a wave. Four numbers stretch, squeeze, slide and lift it into the shape of any steady rhythm.',
  quantities: {
    x: { value: 1, min: 0, max: 12.5, step: 0.05, label: 'x' },
    amplitude: { value: 1, min: 0.2, max: 3, step: 0.1, label: 'A' },
    period: { value: 6.28, min: 1, max: 12.56, step: 0.01, label: 'Period' },
    shift: { value: 0, min: -3.14, max: 3.14, step: 0.01, label: 'C' },
    midline: { value: 0, min: -2, max: 2, step: 0.1, label: 'D' },
  },
  sections: [
    section(
      'From circle to wave',
      paragraph(
        mark('established'),
        'Take the point on the unit circle and let it go round. Now draw a graph beside the circle: across, how far the point has turned, measured in radians; up, the point’s height. The point goes up, over, down, under and back, and the graph it leaves behind is a wave.',
      ),
      figure('wave-graph', { circle: true }, { time: 'x' }),
      paragraph(
        'Move along the wave to x = ',
        scrub('x'),
        '. The dashed line carries the point’s height across to the graph. After 2π, one whole turn, the wave starts again: its ',
        peek('period', 'period'),
        ' is 2π. That is the graph of ',
        tex(String.raw`y = \sin x`),
        '.',
      ),
    ),
    section(
      'Four numbers',
      paragraph(
        mark('established'),
        'Every steady rhythm, from a swing to a tide, has the same shape with different numbers. Four numbers set it:',
      ),
      figure(
        'wave-graph',
        { target: { kind: 'sin', amplitude: 1, period: Math.PI, shift: 0, midline: 0 } },
        { amplitude: 'amplitude', period: 'period', shift: 'shift', midline: 'midline' },
      ),
      formula(String.raw`y = A \sin\big(B(x - C)\big) + D, \qquad B = \frac{2\pi}{\text{period}}`, 'y equals A sine of B times x minus C, plus D; B is 2 pi over the period'),
      paragraph(
        'The amplitude A is ',
        scrub('amplitude'),
        ': how far the wave reaches above and below its middle. The period is ',
        scrub('period'),
        ': drag it to half and two waves fit where one did. The phase shift C is ',
        scrub('shift'),
        ': it slides the wave sideways, to the right when C is positive. The midline D is ',
        scrub('midline'),
        ': it lifts the whole wave.',
      ),
      paragraph(
        mark('consequence'),
        'B is the number written inside the sine. A bigger B squeezes more waves into the same space, so the period is 2π divided by B. With the period at ',
        ref('period'),
        ', B is 2π divided by that.',
      ),
      target('match-period', ['The dashed wave is the same height as sine but repeats twice as often. Set the period so your wave lies on it, then check.'], {
        quantity: 'period',
        expect: 3.14,
        tolerance: 0.05,
        hint: ['Twice as often means half the period of sine.'],
        solution: ['Half of 2π is π ≈ 3.14, which is ', tex(String.raw`y = \sin 2x`), '.'],
      }),
    ),
    section(
      'Cosine and tangent',
      paragraph(
        mark('consequence'),
        'Cosine is the point’s reach instead of its height. Its graph is the same wave started at the top instead of the middle: a sine wave slid left by a quarter turn. So cosine is a ',
        peek('sinusoid', 'sinusoid'),
        ' too, and ',
        tex(String.raw`\cos x = \sin\left(x + \frac{\pi}{2}\right)`),
        '.',
      ),
      paragraph(
        'Tangent is height divided by reach. It is 0 where the point crosses the x-axis and blows up as the point nears the top or bottom, where the reach shrinks to nothing. Its graph breaks at those angles and repeats every π, not 2π.',
      ),
      figure('wave-graph', { kind: 'tan', period: Math.PI }),
      paragraph(
        mark('interpretation'),
        'That is why sine and cosine describe things that swing back and forth and tangent describes things like the angle of a shadow, which can grow without limit.',
        note('Engineers write sinusoids with angular frequency ω in place of B, and talk about phase in place of the shift.'),
      ),
      exercise('period-3x', ['What is the period of ', tex(String.raw`y = \sin 3x`), ', to two decimal places?'], {
        check: 'numeric',
        expect: '2.09',
        tolerance: 0.01,
        placeholder: 'a number',
        hint: ['The period is 2π divided by B.'],
        solution: [tex(String.raw`\frac{2\pi}{3} \approx 2.09`), '.'],
      }),
      exercise('write-wave', ['Write the equation of a sine wave with amplitude 2, period 2π, no shift, and midline y = 1. Use x.'], {
        answer: { kind: 'typed', check: 'expression', expect: '2*sin(x) + 1', placeholder: 'e.g. 3*sin(x) - 2', options: { variable: 'x' } },
        hint: ['Period 2π means B = 1.'],
        solution: [tex(String.raw`y = 2\sin x + 1`), '.'],
      }),
    ),
  ],
};
