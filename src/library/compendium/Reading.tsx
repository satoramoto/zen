import type { ReactNode } from 'react';
import { Text } from '../primitives/Text';
import './Reading.css';

export interface ReadingProps {
  /** The reading measure in `ch` of the body face, 44–76. Default 66. */
  measure?: number;
  children?: ReactNode;
}

/**
 * **Job.** (Compendium mockup stub.) A long-form column at a reading measure with a margin column
 * to its right. Its children are the text; a `Sidenote` or `Mark` inside a paragraph hangs into
 * the margin beside the line it belongs to (a float, Tufte-style), so notes stay anchored without
 * any measuring. The root is a size container: below `46rem` the margin folds away and notes sit
 * inline, as an indented block after their line.
 *
 * **Tuning knobs.** `--cmp-measure` (the text column, set from `measure`), `--cmp-margin` (the
 * margin column, in body `ch`), `--cmp-gutter` (the gap between them).
 */
export function Reading({ measure = 66, children }: ReadingProps) {
  const m = Math.min(76, Math.max(44, measure));
  return (
    <div className="cmp-reading" style={{ ['--cmp-measure' as string]: `${m}ch` }}>
      <Text as="div" role="body" className="cmp-reading__page">
        {children}
      </Text>
    </div>
  );
}

/** A paragraph of the reading column: body text at the reading leading. */
export function P({ children }: { children?: ReactNode }) {
  return (
    <Text as="p" role="body" className="cmp-reading__p">
      {children}
    </Text>
  );
}

/** A section heading in the reading column. */
export function H({ children, id }: { children?: ReactNode; id?: string }) {
  return (
    <Text as="h2" role="heading" id={id} className="cmp-reading__h">
      {children}
    </Text>
  );
}

/** A block that may take the margin too (a figure, a graph, a timeline): the full page width. */
export function Wide({ children }: { children?: ReactNode }) {
  return <div className="cmp-reading__wide">{children}</div>;
}
