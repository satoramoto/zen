import { exercise, figure, formula, mark, note, paragraph, ref, scrub, section, steps, table, target, tex, type Entry } from '../../../model/document';

/**
 * Six tide readings, in hours after midnight and metres above the chart datum: made for the
 * chapter, from a 12.4-hour tide with a 2 m middle and 1.2 m reach, nudged by a few
 * centimetres so no curve fits them perfectly.
 */
export const TIDE = [
  { x: 0, y: 1.01 },
  { x: 2, y: 1.96 },
  { x: 4, y: 3.07 },
  { x: 6, y: 3.05 },
  { x: 8, y: 2.16 },
  { x: 10, y: 1.03 },
];

export const PERIODIC: Entry = {
  id: 'periodic',
  title: 'Periodic things',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Trigonometry'],
  summary: 'Tides, Ferris wheels and the length of the day all go round and come back. Fit a sine wave to them and you can say what happens next.',
  quantities: {
    amplitude: { value: 0.6, min: 0.1, max: 2, step: 0.05, unit: 'm', label: 'Amplitude' },
    period: { value: 9, min: 4, max: 24, step: 0.1, unit: 'h', label: 'Period' },
    shift: { value: 0, min: 0, max: 14, step: 0.1, unit: 'h', label: 'Shift' },
    midline: { value: 1.2, min: 0, max: 4, step: 0.05, unit: 'm', label: 'Midline' },
  },
  sections: [
    section(
      'A tide in six readings',
      paragraph(
        mark('established'),
        'A harbour gauge reads the water height every two hours, starting at midnight. Six readings: low, rising, high, high, falling, low. A tide is a slow wave, so a sine wave should fit.',
      ),
      figure(
        'wave-graph',
        { data: { points: TIDE, band: 0.25, xLabel: 'hour', yLabel: 'm', domain: [-0.5, 14.5], yRange: [0, 4] } },
        { amplitude: 'amplitude', period: 'period', shift: 'shift', midline: 'midline' },
      ),
      paragraph(
        'Fit it by eye. Set the midline to ',
        scrub('midline'),
        ', halfway between the lowest and highest readings. Set the amplitude to ',
        scrub('amplitude'),
        ', half the gap between them. Set the period to ',
        scrub('period'),
        ', the time from one low to the next, and slide the shift to ',
        scrub('shift'),
        ' until the wave rises through the midline when the water does. The caption tells you when every reading sits inside the band.',
      ),
    ),
    section(
      'Reading the model',
      paragraph(
        mark('interpretation'),
        'With the wave fitted, each number means something you could tell a sailor. The midline is the average water level. The amplitude is how far the tide goes above and below it. The period is how long until the pattern repeats, a little over twelve hours for most of the world’s tides because the Moon comes round again a little later each day.',
      ),
      formula(String.raw`h(t) = A\sin\!\left(\frac{2\pi}{P}(t - C)\right) + D`, 'h of t equals A sine of 2 pi over P times t minus C, plus D'),
      paragraph(
        'Your model now has period ',
        ref('period'),
        ' and midline ',
        ref('midline'),
        '. Put a time in and it predicts the height, including at times nobody measured.',
        note('Real tide tables add several waves with different periods, one for the Moon and one for the Sun among them. The sum of a few sinusoids is the idea from the end of the Fourier book.'),
      ),
      target('fit-period', ['Fit the tide, then check your period.'], {
        quantity: 'period',
        expect: 12.4,
        tolerance: 0.6,
        hint: ['Low water is near hour 0 and again near hour 10 or so, but the next low is a bit later than the last reading.'],
        solution: ['About 12.4 hours: anything from 11.8 to 13.0 fits these readings inside the band.'],
      }),
    ),
    section(
      'A Ferris wheel',
      paragraph(
        mark('established'),
        'A wheel 40 m across, its centre 22 m up, turns once every 8 minutes. You get on at the bottom. Your height is a sinusoid too: centre height as the midline, the radius as the amplitude, 8 minutes as the period. Starting at the bottom makes it a cosine turned upside down.',
      ),
      steps(
        'Building the model',
        ['Midline 22, amplitude 20, period 8, so B = 2π ÷ 8.'],
        ['At t = 0 you are at the bottom, 2 m up: ', tex(String.raw`22 - 20\cos 0 = 2`), '. Upside-down cosine starts at its lowest.'],
        [tex(String.raw`h(t) = 22 - 20\cos\!\left(\frac{2\pi}{8} t\right)`)],
      ),
      exercise('ferris', ['Write your height h after t minutes. Use t, and write π as pi.'], {
        answer: { kind: 'typed', check: 'expression', expect: '22 - 20*cos(2*pi*t/8)', placeholder: 'an expression in t', options: { variable: 't', range: [0, 16] } },
        hint: ['Follow the steps above. An expression equal to it in another form is fine.'],
        solution: [tex(String.raw`h(t) = 22 - 20\cos\!\left(\frac{\pi t}{4}\right)`), '.'],
      }),
    ),
    section(
      'Daylight',
      paragraph(
        mark('established'),
        'Far from the equator the length of the day swings over the year: in this made-up but realistic town, about 8 hours in late December and 16 hours in late June, with 12 hours at the two equinoxes in March and September.',
      ),
      table(
        'Daylight through the year',
        [['Month'], ['Daylight']],
        [
          [['December'], ['about 8 h']],
          [['March'], ['about 12 h']],
          [['June'], ['about 16 h']],
          [['September'], ['about 12 h']],
        ],
        { rowHeads: true },
      ),
      paragraph(
        mark('consequence'),
        'Midline 12 hours, amplitude 4 hours, period one year. The sinusoid says the days lengthen fastest around the equinoxes and barely change near the solstices, which is just what people living there notice.',
      ),
      exercise('tide-noon', ['With a period of 12.4 h, amplitude 1.2 m, midline 2.0 m and shift 2 h, how high is the tide at hour 12, to one decimal place?'], {
        check: 'numeric',
        expect: '0.9',
        tolerance: 0.1,
        placeholder: 'metres',
        hint: ['Put t = 12 into h(t) = 1.2 sin(2π/12.4 · (t − 2)) + 2.0, with the calculator in radians.'],
        solution: [tex(String.raw`1.2\sin\!\left(\frac{2\pi}{12.4}\cdot 10\right) + 2.0 \approx 1.2 \times (-0.946) + 2.0 \approx 0.87`), ' m.'],
      }),
    ),
  ],
};
