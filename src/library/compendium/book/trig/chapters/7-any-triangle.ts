import { choice, exercise, figure, formula, mark, paragraph, ref, scrub, section, tex, type Entry } from '../../../model/document';

export const ANY_TRIANGLE: Entry = {
  id: 'any-triangle',
  title: 'Any triangle',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Trigonometry'],
  summary: 'Most triangles have no right angle. Two rules, the law of sines and the law of cosines, solve them anyway, and one awkward case has two answers.',
  quantities: { sideA: { value: 4, min: 1, max: 6, step: 0.1, label: 'Side a' } },
  sections: [
    section(
      'Three angles, three sides',
      paragraph(
        mark('established'),
        'Name the corners A, B and C, and the side across from each corner by the same letter in lower case: side a is across from corner A. Drag any corner of the triangle. The three angles always add up to 180°, and the readouts update.',
      ),
      figure('general-triangle', { law: 'sines' }),
    ),
    section(
      'The law of sines',
      paragraph(
        mark('established'),
        'Divide each side by the sine of the angle across from it. Whatever shape you drag the triangle into, the three answers are the same number:',
      ),
      formula(String.raw`\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C}`, 'a over sine A equals b over sine B equals c over sine C'),
      paragraph(
        mark('interpretation'),
        'A big angle sits across from a long side, in exactly proportion to its sine. If you know two angles and a side, or two sides and an angle across from one of them, this finds the rest.',
      ),
    ),
    section(
      'The law of cosines',
      paragraph(
        mark('established'),
        'When the angle you know is between the two sides you know, the law of sines has nothing to start from. Pythagoras does, with a correction:',
      ),
      formula(String.raw`c^2 = a^2 + b^2 - 2ab\cos C`, 'c squared equals a squared plus b squared minus 2 a b cosine C'),
      figure('general-triangle', { law: 'cosines' }),
      paragraph(
        mark('consequence'),
        'Drag corner C until its angle reads 90°. Cosine of 90° is 0, the correction vanishes, and it is Pythagoras’ theorem. Open the angle wider and the correction adds length; close it and it takes length away.',
      ),
    ),
    section(
      'Area',
      paragraph(
        mark('consequence'),
        'Half base times height still works, and the sine finds the height for you: with sides a and b and the angle C between them, the height above side a is ',
        tex(String.raw`b \sin C`),
        '.',
      ),
      formula(String.raw`\text{Area} = \tfrac12\, ab \sin C`, 'area equals one half a b sine C'),
    ),
    section(
      'Two triangles from the same facts',
      paragraph(
        mark('established'),
        'Fix angle A and side b, and let side a swing from corner C like a door on a hinge. Where it lands on the bottom line is corner B. The figure shows the swing as a dashed circle.',
      ),
      figure('general-triangle', { ambiguous: true }, { sideA: 'sideA' }),
      paragraph(
        'Make side a ',
        scrub('sideA'),
        ' long. Too short and it never reaches the line: no triangle. Exactly long enough and it just touches: one, with a right angle. A bit longer and it crosses the line twice: two different triangles from the same two sides and angle. Longer than b and one of the crossings falls behind A: one again. With a at ',
        ref('sideA'),
        ' the caption says which.',
      ),
      exercise('cosine-side', ['Two sides of a triangle are 5 and 7, with 60° between them. How long is the third side, to two decimal places?'], {
        check: 'numeric',
        expect: '6.24',
        tolerance: 0.01,
        placeholder: 'a length',
        hint: ['The angle is between the two known sides: use the law of cosines.'],
        solution: [tex(String.raw`c^2 = 25 + 49 - 2\cdot5\cdot7\cdot\cos 60^\circ = 39`), ', so ', tex(String.raw`c = \sqrt{39} \approx 6.24`), '.'],
      }),
      exercise('sine-angle', ['In a triangle, A = 30°, a = 4 and b = 6. Find angle B, the sharp one, to one decimal place.'], {
        check: 'numeric',
        expect: '48.6',
        tolerance: 0.1,
        placeholder: 'degrees',
        hint: ['Law of sines: sin B = b·sin A / a.'],
        solution: [tex(String.raw`\sin B = \frac{6 \sin 30^\circ}{4} = 0.75`), ', so ', tex(String.raw`B = \sin^{-1} 0.75 \approx 48.6^\circ`), '. (180° − 48.6° = 131.4° also fits: this is the two-triangle case.)'],
      }),
      choice('how-many', ['A = 30°, b = 5 and a = 3. How many triangles fit?'], {
        options: [
          { id: '0', prompt: ['None'] },
          { id: '1', prompt: ['One'] },
          { id: '2', prompt: ['Two'] },
        ],
        expect: '2',
        hint: ['The shortest a can be and still reach is b·sin A. Compare a with that and with b.'],
        solution: ['b·sin A = 2.5. Side a = 3 is longer than that but shorter than b = 5, so it crosses the line twice: two triangles.'],
      }),
    ),
  ],
};
