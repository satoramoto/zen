import type { ReactNode } from 'react';
import { Text } from '../primitives/Text';
import './Sidenote.css';

export interface SidenoteProps {
  /** The note: a citation or an aside. */
  children?: ReactNode;
  /** A citation rather than an aside: drawn the same, read as a source. */
  cite?: boolean;
}

/**
 * **Job.** (Compendium mockup stub.) A note anchored to a spot in the text. Inside a `Reading`
 * paragraph it leaves a numbered marker at that spot and hangs the note in the margin beside the
 * line (a right float pushed out by the margin's width; successive notes clear each other). The
 * numbers are a CSS counter on the reading page. When the margin folds, the note is an indented
 * block after its line. Citations live here (`cite`).
 */
export function Sidenote({ children, cite = false }: SidenoteProps) {
  return (
    <span className="cmp-sidenote" data-cite={cite ? '' : undefined}>
      <Text role="caption" tone="accent" className="cmp-sidenote__ref" aria-hidden="true" />
      <Text as="small" role="caption" tone="muted" className="cmp-sidenote__note">
        {children}
      </Text>
    </span>
  );
}
