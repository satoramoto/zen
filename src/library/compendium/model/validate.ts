import { exercisesIn, figuresIn, formulasIn, peeksIn, quantitiesIn, runsIn, type Entry } from './document';
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
 * an exercise whose checker the page lacks or whose id repeats, a paragraph with nothing in it.
 * Empty when the entry is sound.
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
    if (!checkerNames.has(e.check)) problems.push(`"${entry.id}": exercise "${e.id}": no checker "${e.check}"`);
  }
  for (const s of entry.sections)
    for (const b of s.blocks)
      if (b.kind === 'paragraph' && !b.runs.some((r) => (typeof r === 'string' ? r.trim() !== '' : 'tex' in r || 'peek' in r || 'scrub' in r || 'ref' in r)))
        problems.push(`"${entry.id}" › ${s.heading}: a paragraph with no text`);
  // Reach every run once so a malformed one surfaces here rather than in the page.
  for (const { run } of runsIn(entry)) if (typeof run !== 'string' && Object.keys(run).length === 0) problems.push(`"${entry.id}": an empty run`);
  return problems;
}
