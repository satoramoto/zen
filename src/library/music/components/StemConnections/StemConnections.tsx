import { Tree } from '../../../foundation/view/Tree';
import { stemConnectionsView } from './StemConnections.model';

export function StemConnections() {
  return <Tree tree={stemConnectionsView()} />;
}
