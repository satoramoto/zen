import type { Book } from '../../model/book';
import { PRIME_WAVES } from './chapter';
import { PRIME_WAVES_GLOSSARY } from './glossary';

/** A video's pictures of primes as waves, rebuilt: one chapter, every picture moved by hand. */
export const PRIME_WAVES_BOOK: Book = {
  id: 'prime-waves',
  title: 'Prime waves',
  subtitle: 'Which patterns are the primes’, which are the screen’s',
  chapters: [PRIME_WAVES],
  heads: PRIME_WAVES_GLOSSARY,
};
