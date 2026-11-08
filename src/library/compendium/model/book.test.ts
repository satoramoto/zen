import { describe, expect, it } from 'vitest';
import { CHECKERS } from '../book/checkers';
import { FIGURES } from '../book/figures';
import { HARMONIC_BOOK } from '../book/harmonic.book';
import { bookIndex, chapterOf, chapterProgress, neighbours, progressKey } from './book';
import { exercisesIn, quantitiesIn } from './document';
import { validateEntry } from './validate';

describe('the sample book', () => {
  const index = Object.keys(bookIndex(HARMONIC_BOOK));
  it('validates every chapter against the book', () => {
    for (const c of HARMONIC_BOOK.chapters) expect(validateEntry(c, { figures: Object.keys(FIGURES), entries: index, checkers: Object.keys(CHECKERS) })).toEqual([]);
  });
  it('indexes its chapters and glossary for peeks', () => {
    expect(index).toEqual(['harmonic-series', 'overtones', 'divergence', 'pythagorean']);
    expect(bookIndex(HARMONIC_BOOK)['overtones'].summary).toMatch(/overtones/i);
  });
  it('declares the quantities its pages use', () => {
    expect(quantitiesIn(chapterOf(HARMONIC_BOOK, 'overtones'))).toEqual(['n']);
    expect(quantitiesIn(chapterOf(HARMONIC_BOOK, 'divergence'))).toEqual([]);
  });
});

describe('chapters', () => {
  it('opens the first chapter for an unknown id', () => {
    expect(chapterOf(HARMONIC_BOOK, 'nope').id).toBe('harmonic-series');
    expect(chapterOf(HARMONIC_BOOK, undefined).id).toBe('harmonic-series');
  });
  it('knows the neighbours', () => {
    expect(neighbours(HARMONIC_BOOK, 'harmonic-series')).toMatchObject({ previous: undefined, next: { id: 'overtones' } });
    expect(neighbours(HARMONIC_BOOK, 'overtones')).toMatchObject({ previous: { id: 'harmonic-series' }, next: { id: 'divergence' } });
    expect(neighbours(HARMONIC_BOOK, 'divergence').next).toBeUndefined();
  });
  it('counts a chapter’s exercises done under chapter-scoped keys', () => {
    const divergence = chapterOf(HARMONIC_BOOK, 'divergence');
    expect(exercisesIn(divergence).map((e) => e.id)).toEqual(['past-two', 'past-three', 'millionth']);
    expect(chapterProgress(divergence, {})).toEqual({ done: 0, total: 3 });
    expect(chapterProgress(divergence, { [progressKey(divergence, 'past-two')]: true, 'overtones/nodes': true })).toEqual({ done: 1, total: 3 });
  });
});
