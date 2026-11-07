// The compendium's document model: an entry is plain data, which `Document` renders. Nothing here
// knows what an entry is about; a figure is a name the page resolves against a registry, a peek
// is the id of another entry, an exercise names its checker. Mathematics enters only as TeX
// strings and as numbers.
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

/**
 * A named number the reader can change: a scrub in the text sets it, a figure bound to it
 * follows, a `ref` run shows it. An entry declares its quantities with their starting values.
 */
export interface Quantity {
  value: number;
  min: number;
  max: number;
  /** The step a scrub moves by; default 1. */
  step?: number;
  /** Said after the number: "Hz", "loops". */
  unit?: string;
  /** Its accessible name; default the quantity's key. */
  label?: string;
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
  | { note: string; cite?: boolean }
  /** A quantity the reader can drag or step, in the text. */
  | { scrub: string }
  /** A quantity's current value, read-only. `format` is a string with `{}` where the number goes. */
  | { ref: string; format?: string };

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
/**
 * A live figure: the name of a component in the page's figure registry, and its props. `bind`
 * ties a prop to a quantity: the figure gets the quantity as that prop and may set it through
 * `on<Prop>` (`{ harmonic: 'n' }` gives it `harmonic` and `onHarmonic`).
 */
export interface FigureBlock {
  kind: 'figure';
  figure: string;
  props?: Record<string, unknown>;
  bind?: Record<string, string>;
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
/** An argument revealed one step at a time; each step is a paragraph. */
export interface StepsBlock {
  kind: 'steps';
  title?: string;
  steps: Run[][];
}
/**
 * A question with one answer the page can check. `check` names a checker in the page's registry
 * (`exact` and `numeric` are built in, `model/exercise.ts`); `expect` is what it compares to, in
 * the checker's own terms; `tolerance` is for numeric ones.
 */
export interface ExerciseBlock {
  kind: 'exercise';
  /** Unique in its entry: progress is kept by it. */
  id: string;
  prompt: Run[];
  check: string;
  expect: string;
  tolerance?: number;
  /** What the answer field suggests: "a whole number". */
  placeholder?: string;
  hint?: Run[];
  solution?: Run[];
}

export type Block = Paragraph | FormulaBlock | FigureBlock | CodeBlock | ProofBlock | TimelineBlock | StepsBlock | ExerciseBlock;

export interface Section {
  heading: string;
  /** An anchor; default none. */
  id?: string;
  blocks: Block[];
}

/** An entry of the compendium: its head, its quantities and its sections. */
export interface Entry extends EntryHead {
  id: string;
  /** Where it sits: "Mathematics", "Acoustics". */
  path?: string[];
  quantities?: Record<string, Quantity>;
  sections: Section[];
}

/* Builders, so an entry reads close to how it's written. */

export const paragraph = (...runs: Run[]): Paragraph => ({ kind: 'paragraph', runs });
export const formula = (tex: string, label?: string): FormulaBlock => ({ kind: 'formula', tex, label });
export const figure = (name: string, props?: Record<string, unknown>, bind?: Record<string, string>): FigureBlock => ({
  kind: 'figure',
  figure: name,
  props,
  bind,
});
export const code = (text: string, options: Omit<CodeBlock, 'kind' | 'code'> = {}): CodeBlock => ({ kind: 'code', code: text, ...options });
export const proof = (graph: ProofGraphData, label: string): ProofBlock => ({ kind: 'proof', graph, label });
export const timeline = (rows: TimelineRow[], axis: AxisPiece[], label: string, caption?: string): TimelineBlock => ({
  kind: 'timeline',
  rows,
  axis,
  label,
  caption,
});
export const steps = (title: string | undefined, ...stepRuns: Run[][]): StepsBlock => ({ kind: 'steps', title, steps: stepRuns });
export const exercise = (id: string, prompt: Run[], answer: Omit<ExerciseBlock, 'kind' | 'id' | 'prompt'>): ExerciseBlock => ({
  kind: 'exercise',
  id,
  prompt,
  ...answer,
});
export const section = (heading: string, ...blocks: Block[]): Section => ({ heading, blocks });
/** An inline formula run. */
export const tex = (source: string, label?: string): Run => ({ tex: source, label });
export const peek = (id: string, text?: string): Run => ({ peek: id, text });
export const mark = (standing: Standing): Run => ({ mark: standing });
export const note = (text: string): Run => ({ note: text });
export const cite = (text: string): Run => ({ note: text, cite: true });
export const scrub = (quantity: string): Run => ({ scrub: quantity });
export const ref = (quantity: string, format?: string): Run => ({ ref: quantity, format });

/* Walks. */

/** Every run in the entry, in reading order: paragraphs, steps, exercise prompts, hints and solutions. */
export function* runsIn(entry: Entry): Generator<{ run: Run; section: string }> {
  for (const s of entry.sections) for (const b of s.blocks) for (const runs of runLists(b)) for (const run of runs) yield { run, section: s.heading };
}

/** The runs a block holds, in reading order. */
function runLists(b: Block): Run[][] {
  return b.kind === 'paragraph' ? [b.runs] : b.kind === 'steps' ? b.steps : b.kind === 'exercise' ? [b.prompt, b.hint ?? [], b.solution ?? []] : [];
}

/** Every formula in the entry, inline and displayed, in reading order, with the section it's in. */
export function* formulasIn(entry: Entry): Generator<{ tex: string; display: boolean; section: string }> {
  for (const s of entry.sections)
    for (const b of s.blocks) {
      if (b.kind === 'formula') yield { tex: b.tex, display: true, section: s.heading };
      for (const runs of runLists(b)) for (const run of runs) if (typeof run !== 'string' && 'tex' in run) yield { tex: run.tex, display: false, section: s.heading };
    }
}

/** The ids of the entries this one peeks at, each once. */
export function peeksIn(entry: Entry): string[] {
  const ids = new Set<string>();
  for (const { run } of runsIn(entry)) if (typeof run !== 'string' && 'peek' in run) ids.add(run.peek);
  return [...ids];
}

/** The names of the figures this entry draws, each once. */
export function figuresIn(entry: Entry): string[] {
  const names = new Set<string>();
  for (const s of entry.sections) for (const b of s.blocks) if (b.kind === 'figure') names.add(b.figure);
  return [...names];
}

/** The quantities the entry's runs and figure bindings use, each once. */
export function quantitiesIn(entry: Entry): string[] {
  const names = new Set<string>();
  for (const { run } of runsIn(entry)) {
    if (typeof run === 'string') continue;
    if ('scrub' in run) names.add(run.scrub);
    if ('ref' in run) names.add(run.ref);
  }
  for (const s of entry.sections) for (const b of s.blocks) if (b.kind === 'figure') for (const q of Object.values(b.bind ?? {})) names.add(q);
  return [...names];
}

/** The entry's exercises, in order. */
export function exercisesIn(entry: Entry): ExerciseBlock[] {
  return entry.sections.flatMap((s) => s.blocks.filter((b): b is ExerciseBlock => b.kind === 'exercise'));
}
