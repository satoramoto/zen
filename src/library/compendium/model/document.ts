// The compendium's document model: an entry is plain data, which `Document` renders. Nothing here
// knows what an entry is about; a figure is a name the page resolves against a registry, a peek
// is the id of another entry. Mathematics enters only as TeX strings.
import type { Standing } from './standing';

/** What a page shows of an entry other than its own: the head of the entry, as a peek. */
export interface EntryHead {
  title: string;
  /** The entry's kind, e.g. "Concept", "Tuning system". */
  kind?: string;
  standing?: Standing;
  /** One or two sentences. */
  summary: string;
}

/** A piece of a paragraph: text, or something hung on the text. */
export type Run =
  | string
  /** An inline formula, in TeX. `label` says it in words for assistive technology. */
  | { tex: string; label?: string }
  /** A mention of another entry, by id; `text` is the words in the paragraph (default its title). */
  | { peek: string; text?: string }
  /** A margin mark: the standing of the claim that follows it. */
  | { mark: Standing }
  /** A sidenote hung beside this spot; `cite` makes it a citation rather than an aside. */
  | { note: string; cite?: boolean };

export interface Paragraph {
  kind: 'paragraph';
  runs: Run[];
}
/** A displayed formula on its own line. */
export interface FormulaBlock {
  kind: 'formula';
  tex: string;
  label?: string;
}
/** A live figure: the name of a component in the page's figure registry, and its props. */
export interface FigureBlock {
  kind: 'figure';
  figure: string;
  props?: Record<string, unknown>;
}
/** Preformatted code; `tag` is a short label drawn over it ("Sample"). */
export interface CodeBlock {
  kind: 'code';
  code: string;
  language?: string;
  tag?: string;
}
export interface ProofNode {
  id: string;
  /** The declaration's name, e.g. `Real.tendsto_sum_range_one_div_nat_succ_atTop`. */
  name: string;
  /** What it says, in words. */
  says: string;
  kind: 'theorem' | 'lemma' | 'definition';
}
export interface ProofGraphData {
  nodes: ProofNode[];
  /** `[uses, usedBy]`: the proof of `usedBy` cites `uses`. */
  edges: [string, string][];
}
/** A proof's dependency graph. */
export interface ProofBlock {
  kind: 'proof';
  graph: ProofGraphData;
  label: string;
}
/** A year; negative is BCE. */
export type Year = number;
export interface TimelineRow {
  id: string;
  /** Who or what the row is ("Nicole Oresme"). */
  label: string;
  /** A span: a life, a period. `circa` marks either end as approximate. */
  span?: { from: Year; to: Year; circa?: boolean };
  /** Points on the span: a work, a proof. */
  points?: { at: Year; label: string; circa?: boolean }[];
}
/** A stretch of the axis drawn to scale; the stretches are joined by a break. */
export interface AxisPiece {
  from: Year;
  to: Year;
  /** Year ticks inside the piece. */
  ticks: Year[];
}
export interface TimelineBlock {
  kind: 'timeline';
  rows: TimelineRow[];
  axis: AxisPiece[];
  label: string;
  caption?: string;
}

export type Block = Paragraph | FormulaBlock | FigureBlock | CodeBlock | ProofBlock | TimelineBlock;

export interface Section {
  heading: string;
  /** An anchor; default none. */
  id?: string;
  blocks: Block[];
}

/** An entry of the compendium: its head, and its sections. */
export interface Entry extends EntryHead {
  id: string;
  /** Where it sits: "Mathematics", "Acoustics". */
  path?: string[];
  sections: Section[];
}

/* Builders, so an entry reads close to how it's written. */

export const paragraph = (...runs: Run[]): Paragraph => ({ kind: 'paragraph', runs });
export const formula = (tex: string, label?: string): FormulaBlock => ({ kind: 'formula', tex, label });
export const figure = (name: string, props?: Record<string, unknown>): FigureBlock => ({ kind: 'figure', figure: name, props });
export const code = (text: string, options: Omit<CodeBlock, 'kind' | 'code'> = {}): CodeBlock => ({ kind: 'code', code: text, ...options });
export const proof = (graph: ProofGraphData, label: string): ProofBlock => ({ kind: 'proof', graph, label });
export const timeline = (rows: TimelineRow[], axis: AxisPiece[], label: string, caption?: string): TimelineBlock => ({
  kind: 'timeline',
  rows,
  axis,
  label,
  caption,
});
export const section = (heading: string, ...blocks: Block[]): Section => ({ heading, blocks });
/** An inline formula run. */
export const tex = (source: string, label?: string): Run => ({ tex: source, label });
export const peek = (id: string, text?: string): Run => ({ peek: id, text });
export const mark = (standing: Standing): Run => ({ mark: standing });
export const note = (text: string): Run => ({ note: text });
export const cite = (text: string): Run => ({ note: text, cite: true });

/* Walks. */

/** Every formula in the entry, inline and displayed, with the section it's in. */
export function* formulasIn(entry: Entry): Generator<{ tex: string; display: boolean; section: string }> {
  for (const s of entry.sections)
    for (const b of s.blocks) {
      if (b.kind === 'formula') yield { tex: b.tex, display: true, section: s.heading };
      if (b.kind === 'paragraph')
        for (const r of b.runs) if (typeof r !== 'string' && 'tex' in r) yield { tex: r.tex, display: false, section: s.heading };
    }
}

/** The ids of the entries this one peeks at, each once. */
export function peeksIn(entry: Entry): string[] {
  const ids = new Set<string>();
  for (const s of entry.sections)
    for (const b of s.blocks)
      if (b.kind === 'paragraph') for (const r of b.runs) if (typeof r !== 'string' && 'peek' in r) ids.add(r.peek);
  return [...ids];
}

/** The names of the figures this entry draws, each once. */
export function figuresIn(entry: Entry): string[] {
  const names = new Set<string>();
  for (const s of entry.sections) for (const b of s.blocks) if (b.kind === 'figure') names.add(b.figure);
  return [...names];
}
