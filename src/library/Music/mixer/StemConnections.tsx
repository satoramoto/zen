import { Tree } from '../../view/Tree';
import { stemConnectionsView } from './StemConnections.model';

export function StemConnections() {
  return <Tree tree={stemConnectionsView()} />;
}
