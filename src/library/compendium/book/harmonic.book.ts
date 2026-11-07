// The sample textbook: three short chapters around one idea, and the glossary they peek at.
import type { Book } from '../model/book';
import { DIVERGENCE } from './divergence.entry';
import { HARMONIC } from './harmonic.entry';
import { PEEKS } from './harmonic.sample';
import { OVERTONES } from './overtones.entry';

export const HARMONIC_BOOK: Book = {
  id: 'harmonic',
  title: 'The Harmonic Series',
  subtitle: 'A short interactive textbook',
  chapters: [HARMONIC, OVERTONES, DIVERGENCE],
  heads: { pythagorean: PEEKS.pythagorean },
};
