import type { ReactNode } from 'react';
import { Tree } from '../../foundation/view/Tree';
import { panelView, type PanelModelProps } from './Panel.model';
import '../../primitives/Text/Text.css';
import '../../primitives/Surface/Surface.css';
import './Panel.css';

export type { PanelModelProps } from './Panel.model';

export interface PanelProps extends Omit<PanelModelProps, 'aside'> {
  /** Beside the title: words, or anything (a count, a link). */
  aside?: string | ReactNode;
  /** To the end of the heading row: a span switch, a button. */
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * **Job.** Holds one part of a dashboard under its title: a list of coins, a chart, a feed. The
 * title can link to the page the panel summarises; an aside says what it shows (`most headroom
 * first`); actions sit at the end of the heading row; with no body it says why.
 *
 * **Parts.** `root` (`lib-panel`), `head`, the heading (`lib-panel__title`, a link when `href`),
 * `aside`, `actions`, `body`, `empty`.
 */
export function Panel({ aside, actions, children, ...props }: PanelProps) {
  const asideSlot = aside !== undefined && typeof aside !== 'string';
  return (
    <Tree
      tree={panelView({ ...props, aside: typeof aside === 'string' ? aside : undefined }, { children: children !== undefined && children !== null, actions: actions !== undefined, aside: asideSlot })}
      slots={{ children, actions, aside: asideSlot ? aside : undefined }}
    />
  );
}

export default Panel;
