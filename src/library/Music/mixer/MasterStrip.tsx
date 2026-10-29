import { Tree } from '../../view/Tree';
import { masterStripHandlers, masterStripView, type MasterStripProps } from './MasterStrip.model';
import './mixer.css';

export type { MasterStripProps } from './MasterStrip.model';

/** Controlled master strip; the shared model owns its complete face and command wiring. */
export function MasterStrip(props: MasterStripProps) {
  return <Tree tree={masterStripView(props)} handlers={masterStripHandlers(props)} />;
}
