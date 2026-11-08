import { choice, exercise, figure, formula, mark, note, paragraph, peek, ref, scrub, section, table, target, tex, type Entry } from '../../../model/document';

export const ANGLES: Entry = {
  id: 'angles',
  title: 'Angles and turns',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Trigonometry'],
  summary: 'An angle is an amount of turning. You already measure it in degrees; this chapter adds radians, which measure the same turn as a length along a circle.',
  quantities: { angle: { value: 90, min: 0, max: 360, step: 1, unit: '°', label: 'Angle' } },
  sections: [
    section(
      'How far round',
      paragraph(
        mark('established'),
        'An angle says how far something has turned. Start with an arm pointing right, along the x-axis, and turn it anticlockwise about the origin. That is an angle in ',
        peek('standard-position', 'standard position'),
        '. Turning clockwise instead gives a negative angle. A full turn back to where you started is 360 degrees, a number chosen thousands of years ago because it divides evenly in so many ways.',
      ),
      figure('arc-wrap', {}, { angle: 'angle' }),
      paragraph(
        'Drag the point round the circle, or set the angle to ',
        scrub('angle'),
        '. The coloured arc is the path the end of the arm has travelled. A quarter turn is 90°, half a turn 180°, three quarters 270°.',
      ),
    ),
    section(
      'A radian is a length',
      paragraph(
        mark('established'),
        'Degrees count turning in small equal steps. There is a second way, which measures the turn by how far the end of the arm travels along the circle. Lay the radius along the arc, like a measuring tape bent round the edge. When the arc is exactly one radius long, the angle is one ',
        peek('radian', 'radian'),
        '. The ticks on the arc in the figure are one radius apart.',
      ),
      paragraph(
        'Right now the arc is ',
        ref('angle', '{}°'),
        ' round. Press One radian in the figure and the arc is exactly as long as the radius: a little over 57°.',
      ),
      paragraph(
        mark('consequence'),
        'Half of the circle is π radiuses long, because a whole circle’s edge is 2π times its radius. So half a turn, 180°, is π radians. Everything else follows from that one fact:',
      ),
      formula(String.raw`\text{radians} = \text{degrees} \times \frac{\pi}{180}`, 'radians equals degrees times pi over 180'),
      table(
        'Common angles in both units',
        [['Degrees'], ['Radians'], ['Of a turn']],
        [
          [['30°'], [tex(String.raw`\frac{\pi}{6}`)], ['a twelfth']],
          [['45°'], [tex(String.raw`\frac{\pi}{4}`)], ['an eighth']],
          [['90°'], [tex(String.raw`\frac{\pi}{2}`)], ['a quarter']],
          [['180°'], [tex(String.raw`\pi`)], ['a half']],
          [['360°'], [tex(String.raw`2\pi`)], ['a whole']],
        ],
        { rowHeads: true },
      ),
      paragraph(
        mark('interpretation'),
        'Why bother with a second unit? Because a radian is a length divided by a length, it has no arbitrary 360 baked in. Later chapters show that sine and cosine behave most simply when their input is in radians.',
        note('The calculator on your phone has a mode switch for this. Most mistakes in trigonometry homework are a calculator left in the wrong mode.'),
      ),
    ),
    section(
      'Going round more than once',
      paragraph(
        mark('established'),
        'Nothing stops the arm turning past 360°. An angle of 390° is a full turn and then 30° more, so it ends in exactly the same place as 30°. Angles that end in the same place are called coterminal. Add or take away whole turns, 360° or 2π, and you get another one.',
      ),
      paragraph(
        'The x- and y-axes cut the plane into four quadrants, numbered anticlockwise from the top right: I, II, III, IV. Where an angle ends decides which quadrant it is in, and the next chapters lean on that a lot.',
      ),
      target(
        'one-radian',
        ['Without pressing the button, drag the figure’s point until the arc is one radius long, then check.'],
        {
          quantity: 'angle',
          expect: 57,
          tolerance: 1.5,
          hint: ['Watch the first tick on the arc: stop when the end of the arc reaches it.'],
          solution: ['One radian is 180/π ≈ 57.3°, so anything from 56° to 58° is there.'],
        },
      ),
      exercise('two-radians', ['How many degrees is 2 radians, to the nearest degree?'], {
        check: 'numeric',
        expect: '115',
        tolerance: 0.5,
        placeholder: 'degrees',
        hint: ['Multiply by 180/π.'],
        solution: [tex(String.raw`2 \times \frac{180}{\pi} \approx 114.6`), ', so 115°.'],
      }),
      choice('quadrant', ['An angle of 200° ends in which quadrant?'], {
        options: [
          { id: 'i', prompt: ['I'] },
          { id: 'ii', prompt: ['II'] },
          { id: 'iii', prompt: ['III'] },
          { id: 'iv', prompt: ['IV'] },
        ],
        expect: 'iii',
        hint: ['180° points straight left. Which way is 20° more?'],
        solution: ['Between 180° and 270°: the third quadrant, below and to the left.'],
      }),
      exercise('coterminal', ['30° and 390° end in the same place. What is the word for angles like that?'], {
        check: 'exact',
        expect: 'coterminal|coterminal angles|coterminal angle',
        placeholder: 'one word',
        hint: ['It is in the first paragraph of this section.'],
        solution: ['Coterminal: they end (terminate) together.'],
      }),
    ),
  ],
};
