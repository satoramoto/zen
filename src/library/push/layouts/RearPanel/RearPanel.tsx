import { Tree } from '../../../foundation/view/Tree';
import { rearPanelHandlers, rearPanelView, type RearPanelModelProps } from './RearPanel.model';
import '../../../primitives/Text/Text.css';
import './RearPanel.css';

export type { RearPanelModelProps, Port } from './RearPanel.model';
export { PORTS } from './RearPanel.model';
export type RearPanelProps = RearPanelModelProps;

/**
 * The Push 3's back: the power button and every port the manual lists.
 *
 * **Job.** Show what the app says is plugged into each port, and report the power button.
 *
 * **Parts.** `[data-control='power']` holds the power button (a `Pad`): its down and up are
 * reported through `onInput` with their times, so a hold's length is the difference. Each
 * `[data-port]` is a port, `data-plugged` naming what is in it (or `none`), with a dot lit when
 * something is.
 */
export function RearPanel(props: RearPanelProps) {
  return <Tree tree={rearPanelView(props)} handlers={rearPanelHandlers(props)} />;
}

export default RearPanel;
