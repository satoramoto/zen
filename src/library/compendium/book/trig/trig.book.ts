import type { Book } from '../../model/book';
import { ANGLES } from './chapters/1-angles';
import { RIGHT_TRIANGLES } from './chapters/2-right-triangles';
import { UNIT_CIRCLE } from './chapters/3-unit-circle';
import { WAVES } from './chapters/4-waves';
import { IDENTITIES } from './chapters/5-identities';
import { UNDOING } from './chapters/6-undoing';
import { ANY_TRIANGLE } from './chapters/7-any-triangle';
import { PERIODIC } from './chapters/8-periodic';
import { TRIG_GLOSSARY } from './glossary';

/** The second test of the compendium: high-school trigonometry, every idea moved by hand before it is written down. */
export const TRIG_BOOK: Book = {
  id: 'trig',
  title: 'Trigonometry',
  subtitle: 'Angles, circles, waves and triangles',
  chapters: [ANGLES, RIGHT_TRIANGLES, UNIT_CIRCLE, WAVES, IDENTITIES, UNDOING, ANY_TRIANGLE, PERIODIC],
  heads: TRIG_GLOSSARY,
};
