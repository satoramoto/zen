import { figuresIn, formulasIn, peeksIn, type Entry } from './document';
import { toMathML } from './formula';

export interface Resolvers {
  /** The figure names the page can draw. */
  figures?: Iterable<string>;
  /** The entry ids the page can peek at. */
  entries?: Iterable<string>;
}

/**
 * What stops an entry rendering as written: a formula temml rejects, a figure the page has no
 * component for, a peek at an entry the page doesn't know, a paragraph with nothing in it. Empty
 * when the entry is sound.
 */
export function validateEntry(entry: Entry, { figures = [], entries = [] }: Resolvers = {}): string[] {
  const problems: string[] = [];
  const figureNames = new Set(figures);
  const entryIds = new Set(entries);
  for (const f of formulasIn(entry)) {
    try {
      toMathML(f.tex, f.display);
    } catch (e) {
      problems.push(`"${entry.id}" › ${f.section}: formula \`${f.tex}\`: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  for (const name of figuresIn(entry)) if (!figureNames.has(name)) problems.push(`"${entry.id}": no figure "${name}"`);
  for (const id of peeksIn(entry)) if (!entryIds.has(id)) problems.push(`"${entry.id}": no entry "${id}" to peek at`);
  for (const s of entry.sections)
    for (const b of s.blocks)
      if (b.kind === 'paragraph' && !b.runs.some((r) => (typeof r === 'string' ? r.trim() !== '' : 'tex' in r || 'peek' in r)))
        problems.push(`"${entry.id}" › ${s.heading}: a paragraph with no text`);
  return problems;
}
