// Segmented as the DOM renderer draws it: the same tree and handlers as `Segmented.tsx` and `Segmented.svelte`.
import { domPart } from '../../foundation/view/dom';
import { segmentedHandlers, segmentedView, type SegmentedModelProps } from './Segmented.model';

export const SegmentedDom = domPart<SegmentedModelProps>({ events: ['onChange'], value: { prop: 'index', on: 'onChange' } }, (props) => ({ tree: segmentedView(props), handlers: segmentedHandlers(props) }));
