import type { ComponentType } from 'react';
import { Stack } from '../primitives/Stack';
import { Surface } from '../primitives/Surface';
import { Text } from '../primitives/Text';
import { Mark, MarkLegend } from './Mark';
import { Formula } from './Math';
import type { Block, Entry, EntryHead, Run } from './model/document';
import { Peek } from './Peek';
import { ProofGraph } from './ProofGraph';
import { H, P, Reading, Wide } from './Reading';
import { Sidenote } from './Sidenote';
import { Timeline } from './Timeline';
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
  /** The reading measure in `ch`, 44–76. Default 66. */
  measure?: number;
}

function RunView({ run, entries }: { run: Run; entries: Record<string, EntryHead> }) {
  if (typeof run === 'string') return run;
  if ('tex' in run) return <Formula tex={run.tex} label={run.label} />;
  if ('mark' in run) return <Mark standing={run.mark} />;
  if ('note' in run) return <Sidenote cite={run.cite}>{run.note}</Sidenote>;
  const head = entries[run.peek];
  if (!head) return <span data-missing-entry={run.peek}>{run.text ?? run.peek}</span>;
  return <Peek entry={head}>{run.text}</Peek>;
}

function BlockView({ block, figures, entries }: { block: Block; figures: FigureRegistry; entries: Record<string, EntryHead> }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <P>
          {block.runs.map((run, i) => (
            <RunView key={i} run={run} entries={entries} />
          ))}
        </P>
      );
    case 'formula':
      return <Formula block tex={block.tex} label={block.label} />;
    case 'figure': {
      const Figure = figures[block.figure];
      return (
        <Wide>
          {Figure ? (
            <Figure {...block.props} />
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
  }
}

/**
 * **Job.** An entry, drawn from its data: the head (where it sits, its title, its summary and the
 * legend of marks), then each section as a heading and its blocks in the `Reading` column.
 * Paragraph runs become text, inline formulas, peeks, marks and sidenotes; the wide blocks
 * (figures, code, proof graphs, timelines) take the margin too. It never evaluates anything: a
 * figure is a component it is handed by name, a formula is TeX typeset to MathML.
 */
export function Document({ entry, figures = {}, entries = {}, measure }: DocumentProps) {
  return (
    <Surface as="article" layer="base" radius="none" className="cmp-document" data-entry={entry.id}>
      <Reading measure={measure}>
        <Stack gap={3} as="header" className="cmp-document__head">
          <Text role="label" tone="muted">
            {['Compendium', ...(entry.path ?? [])].join(' · ')}
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
              <BlockView key={j} block={b} figures={figures} entries={entries} />
            ))}
          </Stack>
        ))}
      </Reading>
    </Surface>
  );
}
