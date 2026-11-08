import { describe, expect, it } from 'vitest';
import { HARMONIC } from '../book/harmonic.entry';
import { HARMONIC_BOOK } from '../book/harmonic.book';
import { bookIndex } from './book';
import { answerOf, choice, exercise, exercisesIn, figuresIn, formulasIn, paragraph, peeksIn, section, table, target, tex, type Entry } from './document';
import { chapterProgress } from './book';
import { toMathML } from './formula';
import { validateEntry } from './validate';

const entry = (...sections: Entry['sections']): Entry => ({ id: 'e', title: 'E', summary: 'An entry.', sections });

describe('toMathML', () => {
  it('typesets TeX to one math element, with the source annotated', () => {
    const inline = toMathML(String.raw`\frac{1}{n}`);
    expect(inline).toMatch(/^<math>/);
    expect(inline).toContain('<mfrac><mn>1</mn><mi>n</mi></mfrac>');
    expect(inline).toContain('<annotation encoding="application/x-tex">\\frac{1}{n}</annotation>');
    expect(toMathML('x', true)).toMatch(/^<math display="block"/);
  });
  it('puts the label on the math element, escaped', () => {
    expect(toMathML('x', false, 'a "quoted" <label> & more')).toMatch(/^<math aria-label="a &quot;quoted&quot; &lt;label> &amp; more">/);
    expect(toMathML('x', true, 'said')).toMatch(/^<math aria-label="said" display="block"/);
  });
  it('throws on TeX it cannot typeset', () => {
    expect(() => toMathML(String.raw`\frac{1}`)).toThrow();
    expect(() => toMathML(String.raw`\nosuchmacro`)).toThrow();
  });
});

describe('walks', () => {
  const e = entry(
    section('A', paragraph('see ', { peek: 'x' }, ' and ', tex('a'), { peek: 'x' }), { kind: 'formula', tex: 'b' }),
    section('B', { kind: 'figure', figure: 'f' }, { kind: 'figure', figure: 'f' }, paragraph({ peek: 'y' })),
  );
  it('finds every formula with its section and whether it is displayed', () => {
    expect([...formulasIn(e)]).toEqual([
      { tex: 'a', display: false, section: 'A' },
      { tex: 'b', display: true, section: 'A' },
    ]);
  });
  it('lists peeks and figures once each', () => {
    expect(peeksIn(e)).toEqual(['x', 'y']);
    expect(figuresIn(e)).toEqual(['f']);
  });
});

describe('validateEntry', () => {
  it('names a bad formula, an unknown figure, an unknown peek and an empty paragraph', () => {
    const e = entry(
      section('Bad', paragraph('ok ', tex(String.raw`\frac{1}`)), { kind: 'figure', figure: 'nope' }, paragraph({ peek: 'ghost' }), paragraph(' ', { mark: 'conjecture' })),
    );
    const problems = validateEntry(e, { figures: ['f'], entries: ['x'] });
    expect(problems).toHaveLength(4);
    expect(problems[0]).toMatch(/"e" › Bad: formula `\\frac\{1\}`/);
    expect(problems[1]).toBe('"e": no figure "nope"');
    expect(problems[2]).toBe('"e": no entry "ghost" to peek at');
    expect(problems[3]).toBe('"e" › Bad: a paragraph with no text');
  });
  it('passes a paragraph that is only a formula or a peek', () => {
    expect(validateEntry(entry(section('S', paragraph(tex('x')), paragraph({ peek: 'x' }))), { entries: ['x'] })).toEqual([]);
  });
  it('passes the harmonic series as written', () => {
    expect(validateEntry(HARMONIC, { figures: ['harmonic-string'], entries: Object.keys(bookIndex(HARMONIC_BOOK)), checkers: ['expression'] })).toEqual([]);
    expect([...formulasIn(HARMONIC)].filter((f) => f.display)).toHaveLength(2);
  });
});

describe('exercise kinds and tables', () => {
  const mixed = entry(
    section(
      'Kinds',
      exercise('typed', ['How many?'], { check: 'numeric', expect: '4' }),
      choice('which', ['Which quadrant?'], { options: [{ id: 'i', prompt: ['One'] }, { id: 'iii', prompt: ['Three', tex('x')] }], expect: 'iii' }),
      target('drag', ['Drag it to 30°.'], { quantity: 'theta', expect: 30, tolerance: 2 }),
      table('Signs', [['θ'], ['sin']], [[['30°'], [tex('1/2')]]], { rowHeads: true }),
    ),
  );
  it('normalises the typed shorthand and keeps the other kinds', () => {
    const [t, c, q] = exercisesIn(mixed);
    expect(answerOf(t)).toEqual({ kind: 'typed', check: 'numeric', expect: '4', tolerance: undefined, placeholder: undefined });
    expect(answerOf(c).kind).toBe('choice');
    expect(answerOf(q)).toEqual({ kind: 'quantity', quantity: 'theta', expect: 30, tolerance: 2 });
  });
  it('counts every kind as an exercise, and walks the options and cells', () => {
    expect(exercisesIn(mixed)).toHaveLength(3);
    expect(chapterProgress(mixed, { 'e/which': true })).toEqual({ done: 1, total: 3 });
    expect([...formulasIn(mixed)].map((f) => f.tex)).toEqual(['x', '1/2']);
  });
  it('validates the choice’s option, the target’s quantity and the table’s shape', () => {
    expect(validateEntry({ ...mixed, quantities: { theta: { value: 0, min: 0, max: 360 } } })).toEqual([]);
    const bad = entry(
      section(
        'Bad',
        choice('which', ['Which?'], { options: [{ id: 'i', prompt: ['One'] }], expect: 'iv' }),
        target('drag', ['Drag.'], { quantity: 'phi', expect: 1, tolerance: 1 }),
        table('Ragged', [['a'], ['b']], [[['1']], [['1'], [' ']]]),
      ),
    );
    expect(validateEntry(bad)).toEqual([
      '"e": exercise "which": expected option "iv" is not listed',
      '"e": exercise "drag": no quantity "phi"',
      '"e" › Bad: table "Ragged": row 1 has 1 cells, the head 2',
      '"e" › Bad: table "Ragged": an empty cell in row 2',
    ]);
  });
});
