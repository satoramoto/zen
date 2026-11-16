import { Tree } from '../../foundation/view/Tree';
import { trackView, type TrackModelProps } from './Track.model';
import '../../primitives/Text/Text.css';
import './Track.css';

// The props and the tree are framework-free, in the model; this file, `Track.svelte` and
// `Track.dom.ts` only hand the model's tree to their `Tree`.
export type { TrackModelProps } from './Track.model';

export type TrackProps = TrackModelProps;

export function Track(props: TrackProps) {
  return <Tree tree={trackView(props)} />;
}

export default Track;
