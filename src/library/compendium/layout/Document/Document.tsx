import { useState, type ComponentType, type ReactNode } from 'react';
import { Stack } from '../../../primitives/Stack';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { Exercise } from '../../components/Exercise/Exercise';
import { Formula } from '../../components/Formula/Formula';
import { Mark, MarkLegend } from '../../components/Mark/Mark';
import { Peek } from '../../components/Peek/Peek';
import { ProofGraph } from '../../components/ProofGraph/ProofGraph';
import { Ref, Scrub } from '../../components/Scrub/Scrub';
import { Sidenote } from '../../components/Sidenote/Sidenote';
import { Steps } from '../../components/Steps/Steps';
import { Timeline } from '../../components/Timeline/Timeline';
import type { Block, Entry, EntryHead, Quantity, Run } from '../../model/document';
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
  /** The reading measure in `ch`, 44–76. Default 66. */
  measure?: number;
  /** Shown above the title in place of "Compendium · path": a book's name, say. */
  crumb?: string;
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

const Runs = ({ runs, page }: { runs: Run[]; page: Page }) => runs.map((run, i) => <RunView key={i} run={run} page={page} />);

function BlockView({ block, page, exerciseNumber }: { block: Block; page: Page; exerciseNumber?: number }) {
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
            <Figure {...block.props} {...bound} />
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
    case 'exercise': {
      const key = `${page.entry.id}/${block.id}`;
      const check = (given: string): Verdict => checkAnswer(page.checkers, block.check, given, block.expect, { tolerance: block.tolerance });
      return (
        <Wide>
          <Exercise
            number={exerciseNumber ? `Exercise ${exerciseNumber}` : undefined}
            prompt={<Runs runs={block.prompt} page={page} />}
            placeholder={block.placeholder}
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
 * **Job.** An entry, drawn from its data: the head (where it sits, its title, its summary and the
 * legend of marks), then each section as a heading and its blocks in the `Reading` column.
 * Paragraph runs become text, inline formulas, peeks, marks, sidenotes, scrubs and refs; the wide
 * blocks (figures, code, proof graphs, timelines, steps, exercises) take the margin too. The
 * entry's quantities are the page's state: a scrub or a bound figure sets one, everything bound
 * to it follows. It never evaluates anything: a figure is a component it is handed by name, a
 * formula is TeX typeset to MathML, an exercise's answer goes to a checker by name.
 */
export function Document({ entry, figures = {}, entries = {}, checkers = {}, progress = {}, onProgress, measure, crumb, footer }: DocumentProps) {
  // The page's quantities, keyed by the entry's id: a new entry brings its own, adjusted during
  // render rather than in an effect (an effect would run after a first interaction that comes
  // before the mount effects flush, and put the starting values back over what the reader set);
  // a host re-rendering with a fresh copy of the same entry keeps what the reader has.
  const [held, setHeld] = useState<{ id: string; quantities: Quantities }>(() => ({ id: entry.id, quantities: { ...entry.quantities } }));
  if (held.id !== entry.id) setHeld({ id: entry.id, quantities: { ...entry.quantities } });
  const quantities = held.id === entry.id ? held.quantities : { ...entry.quantities };
  const page: Page = {
    figures,
    entries,
    checkers,
    quantities,
    setQuantity: (name, value) =>
      setHeld((h) => (h.quantities[name] ? { ...h, quantities: { ...h.quantities, [name]: { ...h.quantities[name], value } } } : h)),
    progress,
    entry,
    onProgress,
  };
  let exercises = 0;
  return (
    <Surface as="article" layer="base" radius="none" className="cmp-document" data-entry={entry.id}>
      <Reading measure={measure}>
        <Stack gap={3} as="header" className="cmp-document__head">
          <Text role="label" tone="muted">
            {crumb ?? ['Compendium', ...(entry.path ?? [])].join(' · ')}
          </Text>
          <Text as="h1" role="display" size="heading" weight="display" tone="primary">
            {entry.title}
          </Text>
          <Text as="p" role="body" tone="secondary" className="cmp-document__lede">
            {entry.summary}
          </Text>
          <MarkLegend />
        </Stack>
        {entry.sections.map((s, i) => (
          <Stack key={s.id ?? i} gap={4} as="section" className="cmp-document__section">
            <H id={s.id}>{s.heading}</H>
            {s.blocks.map((b, j) => (
              <BlockView key={j} block={b} page={page} exerciseNumber={b.kind === 'exercise' ? ++exercises : undefined} />
            ))}
          </Stack>
        ))}
        {footer && <Wide>{footer}</Wide>}
      </Reading>
    </Surface>
  );
}
