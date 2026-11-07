import { describe, expect, it } from 'vitest';
import { FOURIER_BOOK } from '../book/fourier/fourier.book';
import { bookIndex, chapterProgress } from './book';
import { exercisesIn, figuresIn, quantitiesIn } from './document';
import { validateEntry } from './validate';

// The figure names the book's registry provides; the registry itself is React and stays out of
// a model test.
const FIGURE_NAMES = ['epicycles', 'heat-modes', 'step-series', 'rotating-vector', 'pair-to-sine', 'coefficient-finder'];

describe('the Fourier book', () => {
  const index = Object.keys(bookIndex(FOURIER_BOOK));
  it('has seven chapters that each validate against the book', () => {
    expect(FOURIER_BOOK.chapters).toHaveLength(7);
    for (const c of FOURIER_BOOK.chapters) expect(validateEntry(c, { figures: FIGURE_NAMES, entries: index }), c.id).toEqual([]);
  });
  it('drives every chapter with a figure bound to a quantity the text scrubs', () => {
    for (const c of FOURIER_BOOK.chapters) {
      expect(figuresIn(c).length, c.id).toBeGreaterThan(0);
      expect(quantitiesIn(c).length, c.id).toBeGreaterThan(0);
      const scrubs = c.sections.flatMap((s) => s.blocks.flatMap((b) => (b.kind === 'paragraph' ? b.runs : []))).filter((r) => typeof r !== 'string' && 'scrub' in r);
      expect(scrubs.length, c.id).toBeGreaterThan(0);
    }
  });
  it('checks every chapter with at least one exercise', () => {
    for (const c of FOURIER_BOOK.chapters) expect(exercisesIn(c).length, c.id).toBeGreaterThan(0);
    expect(chapterProgress(FOURIER_BOOK.chapters[5], {}).total).toBe(3);
  });
  it('resolves its glossary peeks', () => {
    expect(index).toContain('linear');
    expect(index).toContain('complex-exponential');
  });
});
