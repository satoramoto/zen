import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Stack } from '../../../primitives/Stack/Stack';
import { Surface } from '../../../primitives/Surface/Surface';
import { Text } from '../../../primitives/Text/Text';
import { Exercise } from '../../components/Exercise/Exercise';
import { Formula } from '../../components/Formula/Formula';
import { Mark, MarkLegend } from '../../components/Mark/Mark';
import { Peek } from '../../components/Peek/Peek';
import { ProofGraph } from '../../components/ProofGraph/ProofGraph';
import { Ref, Scrub } from '../../components/Scrub/Scrub';
import { Sidenote } from '../../components/Sidenote/Sidenote';
import { Steps } from '../../components/Steps/Steps';
import { Table } from '../../components/Table/Table';
import { Timeline } from '../../components/Timeline/Timeline';
import { answerOf, exercisesIn, figuresIn, unitSuffix, type Block, type Entry, type EntryHead, type Quantity, type Run } from '../../model/document';
import { checkAnswer, type CheckerRegistry, type Progress, type Verdict } from '../../model/exercise';
import { H, P, Reading, Wide } from '../Reading/Reading';
import './Document.css';

/** The components a page may draw as figures, by the name a `figure` block uses. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FigureRegistry = Record<string, ComponentType<any>>;

export interface DocumentProps {
  entry: Entry;
  /** What a `figure` block resolves against. A name not here draws a notice in its place. */
  figures?: FigureRegistry;
  /** What a `peek` run resolves against, by entry id. An id not here draws as plain words. */
  entries?: Record<string, EntryHead>;
  /** What an exercise's `check` resolves against, beyond the built-in `exact` and `numeric`. */
  checkers?: CheckerRegistry;
  /** Which exercises are already done, by the entry-scoped key `<entry id>/<exercise id>`. */
  progress?: Progress;
  /** Called when an exercise is answered correctly. */
  onProgress?(key: string): void;
  /** Called whenever a quantity changes, with every quantity's current value. */
  onQuantities?(quantities: Record<string, Quantity>): void;
  /** The reading measure in `ch`, 44–76. Default 66. */
  measure?: number;
  /** The chapter's place in a book: its number, how many there are, and the book's title. Without it the plate shows the entry's path. */
  chapter?: { number: number; of: number; book: string };
  /** Drawn after the last section: a book's pager. */
  footer?: ReactNode;
}

type Quantities = Record<string, Quantity>;
type Page = {
  figures: FigureRegistry;
  entries: Record<string, EntryHead>;
  checkers: CheckerRegistry;
  quantities: Quantities;
  setQuantity(name: string, value: number): void;
  progress: Progress;
  entry: Entry;
  onProgress?(key: string): void;
};

function RunView({ run, page }: { run: Run; page: Page }) {
  if (typeof run === 'string') return run;
  if ('tex' in run) return <Formula tex={run.tex} label={run.label} />;
  if ('mark' in run) return <Mark standing={run.mark} />;
  if ('note' in run) return <Sidenote cite={run.cite}>{run.note}</Sidenote>;
  if ('scrub' in run) {
    const q = page.quantities[run.scrub];
    if (!q) return <span data-missing-quantity={run.scrub}>{run.scrub}</span>;
    return <Scrub name={run.scrub} quantity={q} onChange={(v) => page.setQuantity(run.scrub, v)} />;
  }
  if ('ref' in run) {
    const q = page.quantities[run.ref];
    if (!q) return <span data-missing-quantity={run.ref}>{run.ref}</span>;
    return <Ref quantity={q} format={run.format} />;
  }
  const head = page.entries[run.peek];
  if (!head) return <span data-missing-entry={run.peek}>{run.text ?? run.peek}</span>;
  return <Peek entry={head}>{run.text}</Peek>;
}

/** How many decimals a step needs: 1 → 0, 0.5 → 1, 0.25 → 2. */
const decimalsOf = (step: number) => Math.max(0, Math.min(6, -Math.floor(Math.log10(step))));

const Runs = ({ runs, page }: { runs: Run[]; page: Page }) => runs.map((run, i) => <RunView key={i} run={run} page={page} />);

function BlockView({ block, page, figureNumber, exerciseNumber }: { block: Block; page: Page; figureNumber?: number; exerciseNumber?: number }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <P>
          <Runs runs={block.runs} page={page} />
        </P>
      );
    case 'formula':
      return <Formula block tex={block.tex} label={block.label} />;
    case 'figure': {
      const Figure = page.figures[block.figure];
      const bound: Record<string, unknown> = {};
      for (const [prop, name] of Object.entries(block.bind ?? {})) {
        const q = page.quantities[name];
        if (!q) continue;
        bound[prop] = q.value;
        bound[`on${prop[0].toUpperCase()}${prop.slice(1)}`] = (v: number) => page.setQuantity(name, v);
      }
      return (
        <Wide>
          {Figure ? (
            <Figure number={figureNumber ? `Figure ${figureNumber}` : undefined} {...block.props} {...bound} />
          ) : (
            <Text role="caption" tone="warning" data-missing-figure={block.figure}>
              No figure “{block.figure}” on this page.
            </Text>
          )}
        </Wide>
      );
    }
    case 'code':
      return (
        <Wide>
          <Surface material="well" radius="input" className="cmp-document__code">
            <Stack gap={2}>
              {block.tag && (
                <Text role="label" size="caption" tone="warning">
                  {block.tag}
                </Text>
              )}
              <Text as="pre" role="code" size="caption" tone="primary" className="cmp-document__pre" data-language={block.language}>
                {block.code}
              </Text>
            </Stack>
          </Surface>
        </Wide>
      );
    case 'proof':
      return (
        <Wide>
          <ProofGraph data={block.graph} label={block.label} />
        </Wide>
      );
    case 'timeline':
      return (
        <Wide>
          <Stack gap={3}>
            <Timeline rows={block.rows} axis={block.axis} label={block.label} />
            {block.caption && (
              <Text role="caption" tone="muted">
                {block.caption}
              </Text>
            )}
          </Stack>
        </Wide>
      );
    case 'steps':
      return (
        <Wide>
          <Steps title={block.title} steps={block.steps.map((runs, i) => <Runs key={i} runs={runs} page={page} />)} />
        </Wide>
      );
    case 'table':
      return (
        <Wide>
          <Table
            label={block.label}
            head={block.head.map((cell, i) => <Runs key={i} runs={cell} page={page} />)}
            rows={block.rows.map((row) => row.map((cell, i) => <Runs key={i} runs={cell} page={page} />))}
            rowHeads={block.rowHeads}
          />
        </Wide>
      );
    case 'exercise': {
      const key = `${page.entry.id}/${block.id}`;
      const answer = answerOf(block);
      const check = (given: string): Verdict => {
        if (answer.kind === 'choice') return { correct: given === answer.expect };
        if (answer.kind === 'quantity') {
          const q = page.quantities[answer.quantity];
          if (!q) return { correct: false, feedback: `No quantity “${answer.quantity}” on this page.` };
          return { correct: Math.abs(q.value - answer.expect) <= answer.tolerance + 1e-9 };
        }
        return checkAnswer(page.checkers, answer.check, given, answer.expect, { tolerance: answer.tolerance, ...answer.options });
      };
      const q = answer.kind === 'quantity' ? page.quantities[answer.quantity] : undefined;
      return (
        <Wide>
          <Exercise
            number={exerciseNumber ? `Exercise ${exerciseNumber}` : undefined}
            prompt={<Runs runs={block.prompt} page={page} />}
            mode={answer.kind}
            choices={answer.kind === 'choice' ? answer.options.map((o) => ({ id: o.id, prompt: <Runs runs={o.prompt} page={page} /> })) : undefined}
            reading={q && answer.kind === 'quantity' ? `${q.label ?? answer.quantity} = ${q.value.toFixed(decimalsOf(q.step ?? 1))}${unitSuffix(q.unit)}` : undefined}
            placeholder={answer.kind === 'typed' ? answer.placeholder : undefined}
            check={check}
            hint={block.hint && <Runs runs={block.hint} page={page} />}
            solution={block.solution && <Runs runs={block.solution} page={page} />}
            done={page.progress[key] === true}
            onResult={(v) => v.correct && page.onProgress?.(key)}
          />
        </Wide>
      );
    }
  }
}

/**
 * **Job.** An entry, drawn from its data, to the textbook's lock: a plate (the chapter's numeral
 * in the accent, beside its meta) ruled off from the title and summary; then each section with its
 * number before the heading and its blocks in the `Reading` column, body in the pack's reading
 * face. Paragraph runs become text, inline formulas, peeks, marks, sidenotes, scrubs and refs; the
 * wide blocks (figures, code, proof graphs, timelines, steps, exercises) take the margin too. The
 * entry's quantities are the page's state: a scrub or a bound figure sets one, everything bound to
 * it follows, and the host hears every change. It never evaluates anything: a figure is a
 * component it is handed by name, a formula is TeX typeset to MathML, an exercise's answer goes to
 * a checker by name.
 */
export function Document({ entry, figures = {}, entries = {}, checkers = {}, progress = {}, onProgress, onQuantities, measure, chapter, footer }: DocumentProps) {
  // The page's quantities, keyed by the entry's id: a new entry brings its own, adjusted during
  // render rather than in an effect (an effect would run after a first interaction that comes
  // before the mount effects flush, and put the starting values back over what the reader set);
  // a host re-rendering with a fresh copy of the same entry keeps what the reader has.
  const [held, setHeld] = useState<{ id: string; quantities: Quantities }>(() => ({ id: entry.id, quantities: { ...entry.quantities } }));
  if (held.id !== entry.id) setHeld({ id: entry.id, quantities: { ...entry.quantities } });
  const quantities = held.id === entry.id ? held.quantities : { ...entry.quantities };
  // Notify the host after commit: state updaters can run during rendering.
  useEffect(() => { onQuantities?.(held.quantities); }, [held, onQuantities]);
  const page: Page = {
    figures,
    entries,
    checkers,
    quantities,
    setQuantity: (name, value) =>
      setHeld((h) => {
        if (!h.quantities[name]) return h;
        const next = { ...h, quantities: { ...h.quantities, [name]: { ...h.quantities[name], value } } };
        return next;
      }),
    progress,
    entry,
    onProgress,
  };
  const figureCount = figuresIn(entry).length;
  const exerciseCount = exercisesIn(entry).length;
  const counts = [figureCount ? `${figureCount} figure${figureCount === 1 ? '' : 's'}` : '', exerciseCount ? `${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}` : '']
    .filter(Boolean)
    .join(' · ');
  let figuresSoFar = 0;
  let exercisesSoFar = 0;
  return (
    <Surface as="article" layer="base" radius="none" className="cmp-document" data-entry={entry.id}>
      <Reading measure={measure}>
        <Wide>
          <header className="cmp-document__plate">
            <Text as="div" role="display" weight="numeral" tone="accent" tabular className="cmp-document__numeral" aria-hidden="true">
              {chapter ? String(chapter.number).padStart(2, '0') : '§'}
            </Text>
            <Stack gap={1} as="div" className="cmp-document__meta">
              <Text role="label" tone="muted">
                {chapter ? chapter.book : 'Compendium'}
              </Text>
              <Text role="label" tone="muted">
                {chapter ? `Chapter ${chapter.number} of ${chapter.of}` : (entry.path ?? []).join(' · ') || entry.kind || 'Entry'}
              </Text>
              {counts && (
                <Text role="label" tone="muted">
                  {counts}
                </Text>
              )}
            </Stack>
          </header>
        </Wide>
        <Stack gap={3} as="div" className="cmp-document__head">
          <Text as="h1" role="display" tone="primary" className="cmp-document__title">
            {entry.title}
          </Text>
          <Text as="p" role="body" tone="secondary" className="cmp-document__lede">
            {entry.summary}
          </Text>
          <MarkLegend />
        </Stack>
        {entry.sections.map((s, i) => (
          <Stack key={s.id ?? i} gap={5} as="section" className="cmp-document__section">
            <H id={s.id}>
              <Text role="label" tone="accent" tabular className="cmp-document__section-number" aria-hidden="true">
                {chapter ? `${chapter.number}.${i + 1}` : `${i + 1}`}
              </Text>
              {s.heading}
            </H>
            {s.blocks.map((b, j) => (
              <BlockView
                key={j}
                block={b}
                page={page}
                figureNumber={b.kind === 'figure' ? ++figuresSoFar : undefined}
                exerciseNumber={b.kind === 'exercise' ? ++exercisesSoFar : undefined}
              />
            ))}
          </Stack>
        ))}
        {footer && <Wide>{footer}</Wide>}
      </Reading>
    </Surface>
  );
}
