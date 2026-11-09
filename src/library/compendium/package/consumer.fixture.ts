import { exercise, figure, formula, paragraph, scrub, section, type Book } from '@satoramoto/zen/compendium/model';

/** Application-authored data, independent of any sample manuscript. */
export const consumerBook: Book = {
  id: 'consumer', title: 'A consumer-owned book',
  chapters: [{
    id: 'opening', title: 'An opening chapter', summary: 'Readable before hydration.',
    quantities: { angle: { value: 30, min: 5, max: 85, step: 1, unit: '°', label: 'Angle' } },
    sections: [section('Try the reader',
      paragraph('Move the angle to ', scrub('angle'), '.'),
      figure('triangle', {}, { angle: 'angle' }),
      formula('a^2+b^2=c^2', 'Pythagorean theorem'),
      exercise('expression', ['What is one half plus one half?'], {
        check: 'expression', expect: '1', hint: ['Combine the fractions.'], solution: ['One.'],
      }),
    )],
  }],
};
