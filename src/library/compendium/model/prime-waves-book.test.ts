import { describe, expect, it } from 'vitest';
import { PRIME_WAVES } from '../book/prime-waves/chapter';
import { PRIME_WAVES_BOOK } from '../book/prime-waves/prime-waves.book';
import { bookIndex } from './book';
import { answerOf, exercisesIn, runsIn, type Run } from './document';
import { validateEntry } from './validate';

// The names the book's registry provides (the registry itself is React and stays out of a model test).
const FIGURE_NAMES = ['boundary-waves', 'wrapped-waves', 'ring-field', 'gap-spectrum', 'box-field', 'field-shape'];

const isMark = (r: Run | undefined) => typeof r === 'object' && r !== null && 'mark' in r;
const hasScrub = (runs: Run[]) => runs.some((r) => typeof r !== 'string' && 'scrub' in r);
const text = (runs: Run[]) => runs.filter((r): r is string => typeof r === 'string').join('');

describe('the Prime waves book', () => {
  const index = Object.keys(bookIndex(PRIME_WAVES_BOOK));
  it('is one chapter, valid against the book', () => {
    expect(PRIME_WAVES_BOOK.chapters).toEqual([PRIME_WAVES]);
    expect(validateEntry(PRIME_WAVES, { figures: FIGURE_NAMES, entries: index })).toEqual([]);
  });
  it('follows the video’s pictures in order', () => {
    expect(PRIME_WAVES.sections.map((s) => s.heading)).toEqual([
      'A prime as a wave',
      'Many primes, and a circle',
      'Marks that never meet',
      'Thousands of waves as rings',
      'The gaps as a spectrum',
      'From one dimension to two and three',
      'The flat plane and the sphere',
      'What the waves are said to mean',
    ]);
  });
  it('gives every section after the first a bound figure and a scrub', () => {
    for (const s of PRIME_WAVES.sections.slice(1)) {
      expect(s.blocks.some((b) => b.kind === 'figure' && Object.keys(b.bind ?? {}).length > 0), s.heading).toBe(true);
      expect(s.blocks.some((b) => b.kind === 'paragraph' && hasScrub(b.runs)), s.heading).toBe(true);
    }
  });
  it('opens every claim with its standing, and marks the speculation', () => {
    for (const s of PRIME_WAVES.sections)
      for (const b of s.blocks) {
        if (b.kind !== 'paragraph') continue;
        // A paragraph that only tells the reader what to move is an instruction, not a claim.
        if (hasScrub(b.runs) && !isMark(b.runs[0])) continue;
        if (b.runs.length === 1 && text(b.runs).length < 140) continue;
        expect(isMark(b.runs[0]), `${s.heading}: “${text(b.runs).slice(0, 50)}…”`).toBe(true);
      }
    const last = PRIME_WAVES.sections[PRIME_WAVES.sections.length - 1];
    const marks = last.blocks.flatMap((b) => (b.kind === 'paragraph' && isMark(b.runs[0]) ? [(b.runs[0] as { mark: string }).mark] : []));
    expect(marks.slice(0, 2)).toEqual(['speculation', 'speculation']);
  });
  it('credits the video', () => {
    const citations = [...runsIn(PRIME_WAVES)].map((r) => r.run).filter((r): r is { note: string; cite: true } => typeof r !== 'string' && 'note' in r && !!(r as { cite?: boolean }).cite);
    expect(citations.some((c) => /WTF\.IsThisActuallyHappening\?/.test(c.note) && /Y9f-Gq42Pxg/.test(c.note))).toBe(true);
  });
  it('checks the reader three ways, each with a hint and a solution', () => {
    const exercises = exercisesIn(PRIME_WAVES);
    const kinds = new Set(exercises.map((e) => answerOf(e).kind));
    expect([...kinds].sort()).toEqual(['choice', 'quantity', 'typed']);
    for (const e of exercises) {
      expect(e.hint?.length, e.id).toBeGreaterThan(0);
      expect(e.solution?.length, e.id).toBeGreaterThan(0);
    }
    const sectionsWithExercise = PRIME_WAVES.sections.filter((s) => s.blocks.some((b) => b.kind === 'exercise'));
    expect(sectionsWithExercise.length).toBeGreaterThanOrEqual(3);
  });
});
