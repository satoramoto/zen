import type { Book } from '../../model/book';
import { ARROW, BACK, DRAWING, FINDING, FLAT, FOURIER_GLOSSARY, HEAT, STEP } from './chapters';

/** The litmus textbook: can the compendium carry the rotating-arrow story of Fourier series, with the reader driving every idea? */
export const FOURIER_BOOK: Book = {
  id: 'fourier',
  title: 'Fourier Series',
  subtitle: 'From heat flow to drawing with circles',
  chapters: [DRAWING, HEAT, STEP, ARROW, FLAT, FINDING, BACK],
  heads: FOURIER_GLOSSARY,
};
