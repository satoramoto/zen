import { answerOf, exercisesIn, figuresIn, formulasIn, peeksIn, quantitiesIn, runsIn, type Entry, type Run } from './document';
import { builtinCheckers } from './exercise';
import { toMathML } from './formula';

export interface Resolvers {
  /** The figure names the page can draw. */
  figures?: Iterable<string>;
  /** The entry ids the page can peek at. */
  entries?: Iterable<string>;
  /** The checker names the page has, beyond the built-in ones. */
  checkers?: Iterable<string>;
}

/**
 * What stops an entry rendering as written: a formula temml rejects, a figure the page has no
 * component for, a peek at an entry the page doesn't know, a quantity the entry doesn't declare,
 * an exercise whose checker the page lacks, whose expected option isn't listed, whose quantity
 * the entry lacks, or whose id repeats, a table whose rows don't match its head or with an empty
 * cell, a paragraph with nothing in it. Empty when the entry is sound.
 */
export function validateEntry(entry: Entry, { figures = [], entries = [], checkers = [] }: Resolvers = {}): string[] {
  const problems: string[] = [];
  const figureNames = new Set(figures);
  const entryIds = new Set(entries);
  const checkerNames = new Set([...Object.keys(builtinCheckers), ...checkers]);
  const quantities = new Set(Object.keys(entry.quantities ?? {}));
  for (const f of formulasIn(entry)) {
    try {
      toMathML(f.tex, f.display);
    } catch (e) {
      problems.push(`"${entry.id}" › ${f.section}: formula \`${f.tex}\`: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  for (const name of figuresIn(entry)) if (!figureNames.has(name)) problems.push(`"${entry.id}": no figure "${name}"`);
  for (const id of peeksIn(entry)) if (!entryIds.has(id)) problems.push(`"${entry.id}": no entry "${id}" to peek at`);
  for (const q of quantitiesIn(entry)) if (!quantities.has(q)) problems.push(`"${entry.id}": no quantity "${q}"`);
  const seen = new Set<string>();
  for (const e of exercisesIn(entry)) {
    if (seen.has(e.id)) problems.push(`"${entry.id}": exercise id "${e.id}" repeats`);
    seen.add(e.id);
    const a = answerOf(e);
    if (a.kind === 'typed' && !checkerNames.has(a.check)) problems.push(`"${entry.id}": exercise "${e.id}": no checker "${a.check}"`);
    if (a.kind === 'choice' && !a.options.some((o) => o.id === a.expect)) problems.push(`"${entry.id}": exercise "${e.id}": expected option "${a.expect}" is not listed`);
    if (a.kind === 'quantity' && !quantities.has(a.quantity)) problems.push(`"${entry.id}": exercise "${e.id}": no quantity "${a.quantity}"`);
  }
  const hasText = (runs: Run[]) =>
    runs.some((r) => (typeof r === 'string' ? r.trim() !== '' : 'tex' in r || 'peek' in r || 'scrub' in r || 'ref' in r));
  for (const s of entry.sections)
    for (const b of s.blocks) {
      if (b.kind === 'paragraph' && !hasText(b.runs)) problems.push(`"${entry.id}" › ${s.heading}: a paragraph with no text`);
      if (b.kind === 'table') {
        b.rows.forEach((row, i) => {
          if (row.length !== b.head.length) problems.push(`"${entry.id}" › ${s.heading}: table "${b.label}": row ${i + 1} has ${row.length} cells, the head ${b.head.length}`);
        });
        [b.head, ...b.rows].forEach((row, i) => {
          if (row.some((cell) => !hasText(cell))) problems.push(`"${entry.id}" › ${s.heading}: table "${b.label}": an empty cell in ${i === 0 ? 'the head' : `row ${i}`}`);
        });
      }
    }
  // Reach every run once so a malformed one surfaces here rather than in the page.
  for (const { run } of runsIn(entry)) if (typeof run !== 'string' && Object.keys(run).length === 0) problems.push(`"${entry.id}": an empty run`);
  return problems;
}
