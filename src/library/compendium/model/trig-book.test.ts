import { describe, expect, it } from 'vitest';
import { TRIG_CHECKERS } from '../book/trig/checkers';
import { TRIG_BOOK } from '../book/trig/trig.book';
import { bookIndex, chapterProgress } from './book';
import { answerOf, exercisesIn, figuresIn, quantitiesIn, type Block, type Entry, type Run } from './document';
import { validateEntry } from './validate';

// The figure names the book's registry provides (the registry itself is React and stays out of a model test).
const FIGURE_NAMES = ['arc-wrap', 'right-triangle', 'unit-circle', 'wave-graph', 'identity-squares', 'angle-sum', 'general-triangle'];

const hasTex = (runs: Run[]) => runs.some((r) => typeof r !== 'string' && 'tex' in r);
/** The block holds a formula: a displayed one, or an inline one in its own runs. */
const holdsFormula = (b: Block) =>
  b.kind === 'formula' ||
  (b.kind === 'paragraph' && hasTex(b.runs)) ||
  (b.kind === 'steps' && b.steps.some(hasTex)) ||
  (b.kind === 'table' && [...b.head, ...b.rows.flat()].some(hasTex)) ||
  (b.kind === 'exercise' && hasTex(b.prompt));
const blocks = (c: Entry) => c.sections.flatMap((s) => s.blocks);

describe('the trigonometry book', () => {
  const index = Object.keys(bookIndex(TRIG_BOOK));
  it('has the eight chapters in order, each valid against the book', () => {
    expect(TRIG_BOOK.chapters.map((c) => c.title)).toEqual([
      'Angles and turns',
      'Right triangles',
      'The unit circle',
      'Waves',
      'Identities',
      'Undoing',
      'Any triangle',
      'Periodic things',
    ]);
    for (const c of TRIG_BOOK.chapters) expect(validateEntry(c, { figures: FIGURE_NAMES, entries: index, checkers: Object.keys(TRIG_CHECKERS) }), c.id).toEqual([]);
  });
  it('lets the reader move every idea before it is written down', () => {
    for (const c of TRIG_BOOK.chapters) {
      const scrubbed = c.sections.flatMap((s) => s.blocks.flatMap((b) => (b.kind === 'paragraph' ? b.runs : []))).filter((r) => typeof r !== 'string' && 'scrub' in r);
      expect(scrubbed.length, `${c.id}: a scrub`).toBeGreaterThan(0);
      const bound = blocks(c).filter((b) => b.kind === 'figure' && Object.keys(b.bind ?? {}).length > 0);
      expect(bound.length, `${c.id}: a bound figure`).toBeGreaterThan(0);
      expect(quantitiesIn(c).length, c.id).toBeGreaterThan(0);
      const all = blocks(c);
      const firstFigure = all.findIndex((b) => b.kind === 'figure');
      const firstFormula = all.findIndex(holdsFormula);
      expect(firstFigure, `${c.id}: a figure`).toBeGreaterThanOrEqual(0);
      expect(firstFigure < firstFormula || firstFormula === -1, `${c.id}: the first figure comes before the first formula`).toBe(true);
      expect(figuresIn(c).every((f) => FIGURE_NAMES.includes(f)), c.id).toBe(true);
    }
  });
  it('checks every chapter at least twice, with a hint and a solution each time', () => {
    for (const c of TRIG_BOOK.chapters) {
      const exercises = exercisesIn(c);
      expect(exercises.length, c.id).toBeGreaterThanOrEqual(2);
      for (const e of exercises) {
        expect(e.hint?.length, `${c.id}/${e.id}: a hint`).toBeGreaterThan(0);
        expect(e.solution?.length, `${c.id}/${e.id}: a solution`).toBeGreaterThan(0);
      }
      expect(chapterProgress(c, {}).total).toBe(exercises.length);
    }
  });
  it('uses every checking style the page offers', () => {
    const styles = new Set(
      TRIG_BOOK.chapters.flatMap((c) =>
        exercisesIn(c).map((e) => {
          const a = answerOf(e);
          return a.kind === 'typed' ? a.check : a.kind;
        }),
      ),
    );
    for (const style of ['numeric', 'exact', 'expression', 'choice', 'quantity']) expect(styles.has(style), style).toBe(true);
  });
  it('marks the standing of every statement that leads into a displayed formula', () => {
    for (const c of TRIG_BOOK.chapters)
      for (const s of c.sections)
        s.blocks.forEach((b, i) => {
          const next = s.blocks[i + 1];
          if (b.kind !== 'paragraph' || next?.kind !== 'formula') return;
          if (b.runs.some((r) => typeof r !== 'string' && 'scrub' in r)) return;
          const first = b.runs[0];
          expect(typeof first !== 'string' && 'mark' in first, `${c.id} › ${s.heading}: “${String(b.runs.find((r) => typeof r === 'string')).slice(0, 40)}…”`).toBe(true);
        });
  });
  it('resolves its glossary peeks', () => {
    for (const id of ['standard-position', 'radian', 'similar', 'reference-angle', 'period', 'inverse-function', 'identity', 'sinusoid']) expect(index).toContain(id);
  });
});
