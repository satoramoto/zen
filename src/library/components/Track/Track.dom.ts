// Track as the DOM renderer draws it: the same tree as `Track.tsx` and `Track.svelte`.
import { domPart } from '../../foundation/view/dom';
import { trackView, type TrackModelProps } from './Track.model';
import '../../primitives/Text/Text.css';
import './Track.css';

export const TrackDom = domPart<TrackModelProps>({}, (props) => ({ tree: trackView(props) }));
